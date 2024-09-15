import { useCallback, useEffect, useMemo, useState } from "react";
import { isTauri } from "./isTauri";
import { useListen } from "./useListen";

export const useListenState = <T, U>(
    eventName: string,
    transform: (value: T) => Promise<U>,
    defaultValue: (() => U | U),
    initialValue: undefined | (() => Promise<U>) = undefined,
    noTauriValue: (() => U | U) = defaultValue,
): U => {
    const [state, setState] = useState<U>(
        useMemo(() => isTauri() ? evaluate(defaultValue) : evaluate(noTauriValue), [defaultValue, noTauriValue])
    );
    useEffect(() => {
        if (initialValue !== undefined) {
            initialValue().then(value => setState(value));
        }
    }, [initialValue]);

    useListen<T>(eventName, useCallback(async payload => {
        setState(await transform(payload.payload));
    }, [transform]));

    return state;
};

const evaluate = <T>(
    initiator: () => T | T
): T => {
    if (typeof initiator === 'function') {
        return initiator();
    } else {
        return initiator;
    }
}
