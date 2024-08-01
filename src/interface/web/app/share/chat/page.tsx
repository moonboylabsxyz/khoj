'use client'

import styles from './sharedChat.module.css';
import React, { Suspense, useEffect, useRef, useState } from 'react';

import SidePanel from '../../components/sidePanel/chatHistorySidePanel';
import ChatHistory from '../../components/chatHistory/chatHistory';
import NavMenu from '../../components/navMenu/navMenu';
import Loading from '../../components/loading/loading';

import 'katex/dist/katex.min.css';

import { useIPLocationData, welcomeConsole } from '../../common/utils';
import { useAuthenticatedData } from '@/app/common/auth';

import ChatInputArea, { ChatOptions } from '@/app/components/chatInputArea/chatInputArea';
import { StreamMessage } from '@/app/components/chatMessage/chatMessage';
import { convertMessageChunkToJson, handleCompiledReferences, handleImageResponse, RawReferenceData, setupWebSocket } from '@/app/common/chatFunctions';
import { AgentData } from '@/app/agents/page';


interface ChatBodyDataProps {
    chatOptionsData: ChatOptions | null;
    setTitle: (title: string) => void;
    setUploadedFiles: (files: string[]) => void;
    isMobileWidth?: boolean;
    publicConversationSlug: string;
    streamedMessages: StreamMessage[];
    isLoggedIn: boolean;
    conversationId?: string;
    setQueryToProcess: (query: string) => void;
}


function ChatBodyData(props: ChatBodyDataProps) {
    const [message, setMessage] = useState('');
    const [processingMessage, setProcessingMessage] = useState(false);
    const [agentMetadata, setAgentMetadata] = useState<AgentData | null>(null);

    useEffect(() => {
        if (message) {
            setProcessingMessage(true);
            props.setQueryToProcess(message);
        }
    }, [message]);

    useEffect(() => {
        console.log("Streamed messages", props.streamedMessages);
        if (props.streamedMessages &&
            props.streamedMessages.length > 0 &&
            props.streamedMessages[props.streamedMessages.length - 1].completed) {

            setProcessingMessage(false);
        } else {
            setMessage('');
        }
    }, [props.streamedMessages]);

    if (!props.publicConversationSlug && !props.conversationId) {
        return (
            <div className={styles.suggestions}>
                Whoops, nothing to see here!
            </div>
        );
    }

    return (
        <>
            <div className={false ? styles.chatBody : styles.chatBodyFull}>
                <ChatHistory
                    publicConversationSlug={props.publicConversationSlug}
                    conversationId={props.conversationId || ''}
                    setAgent={setAgentMetadata}
                    setTitle={props.setTitle}
                    pendingMessage={processingMessage ? message : ''}
                    incomingMessages={props.streamedMessages} />
            </div>
            <div className={`${styles.inputBox} shadow-md bg-background align-middle items-center justify-center px-3`}>
                <ChatInputArea
                    isLoggedIn={props.isLoggedIn}
                    sendMessage={(message) => setMessage(message)}
                    sendDisabled={processingMessage}
                    chatOptionsData={props.chatOptionsData}
                    conversationId={props.conversationId}
                    agentColor={agentMetadata?.color}
                    isMobileWidth={props.isMobileWidth}
                    setUploadedFiles={props.setUploadedFiles} />
            </div>
        </>
    );
}

export default function SharedChat() {
    const [chatOptionsData, setChatOptionsData] = useState<ChatOptions | null>(null);
    const [isLoading, setLoading] = useState(true);
    const [title, setTitle] = useState('Khoj AI - Chat');
    const [conversationId, setConversationID] = useState<string | undefined>(undefined);
    const [messages, setMessages] = useState<StreamMessage[]>([]);
    const [queryToProcess, setQueryToProcess] = useState<string>('');
    const [processQuerySignal, setProcessQuerySignal] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [isMobileWidth, setIsMobileWidth] = useState(false);
    const [paramSlug, setParamSlug] = useState<string | undefined>(undefined);

    const locationData = useIPLocationData();
    const authenticatedData = useAuthenticatedData();

    welcomeConsole();


    useEffect(() => {
        fetch('/api/chat/options')
            .then(response => response.json())
            .then((data: ChatOptions) => {
                setLoading(false);
                // Render chat options, if any
                if (data) {
                    setChatOptionsData(data);
                }
            })
            .catch(err => {
                console.error(err);
                return;
            });

        setIsMobileWidth(window.innerWidth < 786);

        window.addEventListener('resize', () => {
            setIsMobileWidth(window.innerWidth < 786);
        });

        setParamSlug(window.location.pathname.split('/').pop() || '');

    }, []);

    useEffect(() => {
        if (queryToProcess && !conversationId) {
            // If the user has not yet started conversing in the chat, create a new conversation
            fetch(`/api/chat/share/fork?public_conversation_slug=${paramSlug}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(response => response.json())
                .then(data => {
                    setConversationID(data.conversation_id);
                })
                .catch(err => {
                    console.error(err);
                    return;
                });
            return;
        }


        if (queryToProcess) {
            // Add a new object to the state
            const newStreamMessage: StreamMessage = {
                rawResponse: "",
                trainOfThought: [],
                context: [],
                onlineContext: {},
                completed: false,
                timestamp: (new Date()).toISOString(),
                rawQuery: queryToProcess || "",
            }
            setMessages(prevMessages => [...prevMessages, newStreamMessage]);
            setProcessQuerySignal(true);
        }
    }, [queryToProcess]);

    useEffect(() => {
        if (processQuerySignal) {
            chat();
        }
    }, [processQuerySignal]);


    async function readChatStream(response: Response) {
        if (!response.ok) throw new Error(response.statusText);
        if (!response.body) throw new Error("Response body is null");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const eventDelimiter = '␃🔚␗';
        let buffer = "";

        while (true) {

            const { done, value } = await reader.read();
            if (done) {
                setQueryToProcess('');
                setProcessQuerySignal(false);
                break;
            }

            const chunk = decoder.decode(value, { stream: true });

            buffer += chunk;

            let newEventIndex;
            while ((newEventIndex = buffer.indexOf(eventDelimiter)) !== -1) {
                const event = buffer.slice(0, newEventIndex);
                buffer = buffer.slice(newEventIndex + eventDelimiter.length);
                if (event) {
                    processMessageChunk(event);
                }
            }

        }
    }

    async function chat() {
        if (!queryToProcess || !conversationId) return;
        let chatAPI = `/api/chat?q=${encodeURIComponent(queryToProcess)}&conversation_id=${conversationId}&stream=true&client=web`;
        if (locationData) {
            chatAPI += `&region=${locationData.region}&country=${locationData.country}&city=${locationData.city}&timezone=${locationData.timezone}`;
        }

        const response = await fetch(chatAPI);
        try {
            await readChatStream(response);
        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        (async () => {
            if (conversationId) {
                // Add a new object to the state
                const newStreamMessage: StreamMessage = {
                    rawResponse: "",
                    trainOfThought: [],
                    context: [],
                    onlineContext: {},
                    completed: false,
                    timestamp: (new Date()).toISOString(),
                    rawQuery: queryToProcess || "",
                }
                setProcessQuerySignal(true);
                setMessages(prevMessages => [...prevMessages, newStreamMessage]);
            }
        })();
    }, [conversationId]);

    function processMessageChunk(rawChunk: string) {
        const chunk = convertMessageChunkToJson(rawChunk);
        const currentMessage = messages.find(message => !message.completed);

        if (!currentMessage) {
            return;
        }

        if (!chunk || !chunk.type) {
            return;
        }

        if (chunk.type === "status") {
            const statusMessage = chunk.data as string;
            currentMessage.trainOfThought.push(statusMessage);
        } else if (chunk.type === "references") {
            const references = chunk.data as RawReferenceData;

            if (references.context) {
                currentMessage.context = references.context;
            }

            if (references.onlineContext) {
                currentMessage.onlineContext = references.onlineContext;
            }
        } else if (chunk.type === "message") {
            const chunkData = chunk.data;

            if (chunkData !== null && typeof chunkData === 'object') {
                try {
                    const jsonData = chunkData as any;
                    if (jsonData.image || jsonData.detail) {
                        let responseWithReference = handleImageResponse(chunk.data, true);
                        if (responseWithReference.response) currentMessage.rawResponse = responseWithReference.response;
                        if (responseWithReference.online) currentMessage.onlineContext = responseWithReference.online;
                        if (responseWithReference.context) currentMessage.context = responseWithReference.context;
                    } else if (jsonData.response) {
                        currentMessage.rawResponse = jsonData.response;
                    }
                    else {
                        console.log("any message", chunk);
                    }
                } catch (e) {
                    currentMessage.rawResponse += chunkData;
                }
            } else {
                currentMessage.rawResponse += chunkData;
            }
        } else if (chunk.type === "end_llm_response") {
            currentMessage.completed = true;
        }
        setMessages([...messages]);
    }

    if (isLoading) {
        return <Loading />;
    }

    if (!paramSlug) {
        return (
            <div className={styles.suggestions}>
                Whoops, nothing to see here!
            </div>
        );
    }


    return (
        <div className={`${styles.main} ${styles.chatLayout}`}>
            <title>
                {title}
            </title>
            <div className={styles.sidePanel}>
                <SidePanel
                    conversationId={conversationId ?? null}
                    uploadedFiles={uploadedFiles}
                    isMobileWidth={isMobileWidth}
                />
            </div>

            <div className={styles.chatBox}>
                <NavMenu selected="Chat" title={title} />
                <div className={styles.chatBoxBody}>
                    <Suspense fallback={<Loading />}>
                        <ChatBodyData
                            conversationId={conversationId}
                            streamedMessages={messages}
                            setQueryToProcess={setQueryToProcess}
                            isLoggedIn={authenticatedData !== null}
                            publicConversationSlug={paramSlug}
                            chatOptionsData={chatOptionsData}
                            setTitle={setTitle}
                            setUploadedFiles={setUploadedFiles}
                            isMobileWidth={isMobileWidth} />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
