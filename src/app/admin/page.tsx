export const dynamic = "force-dynamic";

import { getPasskeyModel } from "@/models/Passkey";
import SetupPasskey from "./buttons/SetupPasskey";
import DashboardButton from "./buttons/Dashboard";
import LoginPasskey from "./buttons/LoginPasskey";
import { validateSessionCookie as validate } from "@/lib/auth";
import DashboardContent from "./DashboardContent";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const Passkey = await getPasskeyModel();
    const exists = await Passkey.exists({});

    const successParam = (await searchParams)?.success;
    if (successParam === 'true') {
        return makeBody("passkey setup success", "passkey has been set. you may now proceed to the dashboard.", true, 'dashboard');
    }

    if (exists) {
        const isAuthenticated = await validate();
        if (isAuthenticated) {
            return <DashboardContent />;
        }

        return makeBody("admin login", "authenticate with your passkey to continue.", true, 'login');
    }

   return makeBody("passkey setup", "create the one and only passkey for this instance.", true, 'passkey');
}

function makeBody(title: string, description: string, includeButton: boolean, buttonType: 'passkey' | 'dashboard' | 'login' | null) {
    return (
        <div className="min-h-screen grid bg-white dark:bg-[#09090b] grid-rows-[minmax(14vh,1fr)_auto_minmax(14vh,1fr)]">
            <div className="w-full max-w-3xl justify-self-center text-left px-[2.5vh] row-start-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-[#0a0a0a] dark:text-white">{title}</h1>
                <p className="text-lg sm:text-xl text-[#374151] dark:text-[#9ca3af]">{description}</p>
                {includeButton && (
                    buttonType === 'passkey' ? <SetupPasskey /> :
                    buttonType === 'dashboard' ? <DashboardButton /> :
                    buttonType === 'login' ? <LoginPasskey /> : null
                )}
            </div>
        </div>
    )
}