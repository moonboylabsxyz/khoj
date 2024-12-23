"use client";

import styles from "./navMenu.module.css";
import Link from "next/link";
import { useAuthenticatedData } from "@/app/common/auth";
import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarTrigger,
} from "@/components/ui/menubar";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, UserCircle, Question, GearFine, ArrowRight, Code } from "@phosphor-icons/react";
import { KhojAgentLogo, KhojAutomationLogo, KhojSearchLogo } from "../logo/khojLogo";
import { useIsMobileWidth } from "@/app/common/utils";
import LoginPrompt from "../loginPrompt/loginPrompt";
import { Button } from "@/components/ui/button";

function SubscriptionBadge({ is_active }: { is_active: boolean }) {
    return (
        <div className="flex flex-row items-center">
            <div
                className={`w-3 h-3 rounded-full ${is_active ? "bg-yellow-500" : "bg-muted"} mr-1`}
            ></div>
            <p className="text-xs">{is_active ? "Futurist" : "Free"}</p>
        </div>
    );
}

function VersionBadge({ version }: { version: string }) {
    return (
        <div className="flex flex-row items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <p className="text-xs">{version}</p>
        </div>
    );
}

export default function NavMenu() {
    const userData = useAuthenticatedData();
    const [darkMode, setDarkMode] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const isMobileWidth = useIsMobileWidth();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    useEffect(() => {
        if (localStorage.getItem("theme") === "dark") {
            document.documentElement.classList.add("dark");
            setDarkMode(true);
        } else if (localStorage.getItem("theme") === "light") {
            document.documentElement.classList.remove("dark");
            setDarkMode(false);
        } else {
            const mq = window.matchMedia("(prefers-color-scheme: dark)");

            if (mq.matches) {
                document.documentElement.classList.add("dark");
                setDarkMode(true);
            }
        }

        setInitialLoadDone(true);
    }, []);

    useEffect(() => {
        if (!initialLoadDone) return;
        toggleDarkMode(darkMode);
    }, [darkMode, initialLoadDone]);

    function toggleDarkMode(darkMode: boolean) {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("theme", darkMode ? "dark" : "light");
    }

    return (
        <div className={styles.titleBar}>
            {showLoginPrompt && (
                <LoginPrompt
                    onOpenChange={setShowLoginPrompt}
                    isMobileWidth={isMobileWidth}
                    loginRedirectMessage={"Login to your second brain"}
                />
            )}
            {isMobileWidth ? (
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        {userData ? (
                            <Avatar
                                className={`h-10 w-10 border-2 ${userData.is_active ? "border-yellow-500" : "border-stone-700 dark:border-stone-300"}`}
                            >
                                <AvatarImage src={userData?.photo} alt="user profile" />
                                <AvatarFallback className="bg-transparent hover:bg-muted">
                                    {userData?.username[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <UserCircle className="h-10 w-10" />
                        )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="gap-2">
                        <DropdownMenuItem className="w-full">
                            <div className="flex flex-col">
                                <p className="font-semibold">{userData?.email}</p>
                                <SubscriptionBadge is_active={userData?.is_active ?? false} />
                                {userData?.khoj_version && (
                                    <VersionBadge version={userData?.khoj_version} />
                                )}
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => setDarkMode(!darkMode)}
                            className="w-full cursor-pointer"
                        >
                            <div className="flex flex-rows">
                                {darkMode ? (
                                    <Sun className="w-6 h-6" />
                                ) : (
                                    <Moon className="w-6 h-6" />
                                )}
                                <p className="ml-3 font-semibold">
                                    {darkMode ? "Light Mode" : "Dark Mode"}
                                </p>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Link href="/agents" className="no-underline w-full">
                                <div className="flex flex-rows">
                                    <KhojAgentLogo className="w-6 h-6" />
                                    <p className="ml-3 font-semibold">Agents</p>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Link href="/automations" className="no-underline w-full">
                                <div className="flex flex-rows">
                                    <KhojAutomationLogo className="w-6 h-6" />
                                    <p className="ml-3 font-semibold">Automations</p>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                        {userData && (
                            <DropdownMenuItem>
                                <Link href="/search" className="no-underline w-full">
                                    <div className="flex flex-rows">
                                        <KhojSearchLogo className="w-6 h-6" />
                                        <p className="ml-3 font-semibold">Search</p>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        )}
                        {userData && (
                            <DropdownMenuItem>
                                <Link href="/settings" className="no-underline w-full">
                                    <div className="flex flex-rows">
                                        <GearFine className="w-6 h-6" />
                                        <p className="ml-3 font-semibold">Settings</p>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Link href="https://docs.khoj.dev" className="no-underline w-full">
                                    <div className="flex flex-rows">
                                        <Question className="w-6 h-6" />
                                        <p className="ml-3 font-semibold">Help</p>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Link
                                    href="https://github.com/khoj-ai/khoj/releases"
                                    className="no-underline w-full"
                                >
                                    <div className="flex flex-rows">
                                        <Code className="w-6 h-6" />
                                        <p className="ml-3 font-semibold">Releases</p>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                            {userData ? (
                                <DropdownMenuItem>
                                    <Link href="/auth/logout" className="no-underline w-full">
                                        <div className="flex flex-rows">
                                            <ArrowRight className="w-6 h-6" />
                                            <p className="ml-3 font-semibold">Logout</p>
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem>
                                    <Button
                                        variant={"ghost"}
                                        onClick={() => setShowLoginPrompt(true)}
                                        className="no-underline w-full text-left p-0 content-start justify-start items-start h-fit"
                                    >
                                        <div className="flex flex-rows text-left content-start justify-start items-start p-0">
                                            <ArrowRight className="w-6 h-6" />
                                            <p className="ml-3 font-semibold">Login</p>
                                        </div>
                                    </Button>
                                </DropdownMenuItem>
                            )}
                        </>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Menubar className="border-none">
                    <MenubarMenu>
                        <MenubarTrigger>
                            {userData ? (
                                <Avatar
                                    className={`h-10 w-10 border-2 ${userData.is_active ? "border-yellow-500" : "border-stone-700 dark:border-stone-300"}`}
                                >
                                    <AvatarImage src={userData?.photo} alt="user profile" />
                                    <AvatarFallback className="bg-transparent hover:bg-muted">
                                        {userData?.username[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            ) : (
                                <UserCircle className="w-10 h-10" />
                            )}
                        </MenubarTrigger>
                        <MenubarContent align="end" className="rounded-xl gap-2">
                            <MenubarItem className="w-full">
                                <div className="flex flex-col">
                                    <p className="font-semibold">{userData?.email}</p>
                                    <SubscriptionBadge is_active={userData?.is_active ?? false} />
                                    {userData?.khoj_version && (
                                        <VersionBadge version={userData?.khoj_version} />
                                    )}
                                </div>
                            </MenubarItem>
                            <MenubarSeparator className="dark:bg-white height-[2px] bg-black" />
                            <MenubarItem
                                onClick={() => setDarkMode(!darkMode)}
                                className="w-full hover:cursor-pointer"
                            >
                                <div className="flex flex-rows">
                                    {darkMode ? (
                                        <Sun className="w-6 h-6" />
                                    ) : (
                                        <Moon className="w-6 h-6" />
                                    )}
                                    <p className="ml-3 font-semibold">
                                        {darkMode ? "Light Mode" : "Dark Mode"}
                                    </p>
                                </div>
                            </MenubarItem>
                            <MenubarItem>
                                <Link href="/agents" className="no-underline w-full">
                                    <div className="flex flex-rows">
                                        <KhojAgentLogo className="w-6 h-6" />
                                        <p className="ml-3 font-semibold">Agents</p>
                                    </div>
                                </Link>
                            </MenubarItem>
                            <MenubarItem>
                                <Link href="/automations" className="no-underline w-full">
                                    <div className="flex flex-rows">
                                        <KhojAutomationLogo className="w-6 h-6" />
                                        <p className="ml-3 font-semibold">Automations</p>
                                    </div>
                                </Link>
                            </MenubarItem>
                            {userData && (
                                <MenubarItem>
                                    <Link href="/search" className="no-underline w-full">
                                        <div className="flex flex-rows">
                                            <KhojSearchLogo className="w-6 h-6" />
                                            <p className="ml-3 font-semibold">Search</p>
                                        </div>
                                    </Link>
                                </MenubarItem>
                            )}
                            {userData && (
                                <MenubarItem>
                                    <Link href="/settings" className="no-underline w-full">
                                        <div className="flex flex-rows">
                                            <GearFine className="w-6 h-6" />
                                            <p className="ml-3 font-semibold">Settings</p>
                                        </div>
                                    </Link>
                                </MenubarItem>
                            )}
                            <>
                                <MenubarSeparator className="dark:bg-white height-[2px] bg-black" />
                                <MenubarItem>
                                    <Link
                                        href="https://docs.khoj.dev"
                                        className="no-underline w-full"
                                    >
                                        <div className="flex flex-rows">
                                            <Question className="w-6 h-6" />
                                            <p className="ml-3 font-semibold">Help</p>
                                        </div>
                                    </Link>
                                </MenubarItem>

                                <MenubarItem>
                                    <Link
                                        href="https://github.com/khoj-ai/khoj/releases"
                                        className="no-underline w-full"
                                    >
                                        <div className="flex flex-rows">
                                            <Code className="w-6 h-6" />
                                            <p className="ml-3 font-semibold">Releases</p>
                                        </div>
                                    </Link>
                                </MenubarItem>
                                {userData ? (
                                    <MenubarItem>
                                        <Link href="/auth/logout" className="no-underline w-full">
                                            <div className="flex flex-rows">
                                                <ArrowRight className="w-6 h-6" />
                                                <p className="ml-3 font-semibold">Logout</p>
                                            </div>
                                        </Link>
                                    </MenubarItem>
                                ) : (
                                    <MenubarItem>
                                        <Button
                                            variant={"ghost"}
                                            onClick={() => setShowLoginPrompt(true)}
                                            className="no-underline w-full text-left p-0 content-start justify-start items-start h-fit"
                                        >
                                            <div className="flex flex-rows text-left content-start justify-start items-start p-0">
                                                <ArrowRight className="w-6 h-6" />
                                                <p className="ml-3 font-semibold">Login</p>
                                            </div>
                                        </Button>
                                    </MenubarItem>
                                )}
                            </>
                        </MenubarContent>
                    </MenubarMenu>
                </Menubar>
            )}
        </div>
    );
}
