import { useCallback, useEffect, useMemo, useState } from "react";
import { isTauri } from "./isTauri";
import { useListen } from "./useListen";

/**
 * A hook to use value of Tauri event as a React state.
 *
 * @template T - The type where Tauri event returns
 * @template U - The type of useState
 *
 * @param {string} eventName - The name of the event to listen for.
 * @param {(value: T) => Promise<U>} transform - An function to transform the event value into state value.
 * @param {(U | (() => U))} defaultValue - The value or a function which gives the default value of React state.
 * @param {undefined | (() => Promise<U>)} [initialValue] - The function which is called once on initialize and returns state value. This is called only if Tauri is not available.
 * @param {(U | (() => U))} [noTauriValue=defaultValue] - The value or function returning the value to use if Tauri is not available; defaults to `defaultValue`.
 *
 * @returns {U} - The React state
 */
export const useListenState = <T, U>(
    eventName: string,
    transform: (value: T) => Promise<U>,
    defaultValue: ((() => U) | U),
    initialValue: undefined | (() => Promise<U>) = undefined,
    noTauriValue: ((() => U) | U) = defaultValue,
): U => {
    const [state, setState] = useState<U>(
        useMemo(() => isTauri() ? evaluate(defaultValue) : evaluate(noTauriValue), [defaultValue, noTauriValue])
    );

    useEffect(() => {
        if (initialValue !== undefined && isTauri()) {
            initialValue().then(value => setState(value));
        }
    }, [initialValue]);

    useListen<T>(eventName, useCallback(async payload => {
        setState(await transform(payload.payload));
    }, [transform]));

    return state;
};

const evaluate = <T>(
    initiator: (() => T) | T
): T => {
    if (typeof initiator === 'function') {
        return (initiator as () => T)();
    } else {
        return initiator;
    }
}
