import { listen, type EventCallback } from "@tauri-apps/api/event";
import { useEffect } from "react";

export const useListen = <T>(
    eventName: string,
    action: (event: Parameters<EventCallback<T>>[0]) => Promise<void>
) => {
    useEffect(() => {
        const unlisten = listen<T>(eventName, payload => {
            action(payload);
        });
        return () => {
            unlisten.then((f) => f());
        };
    }, [eventName, action]);
};