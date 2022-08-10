export const isSameYear = (a, b) => {
    return a.getUTCFullYear() === b.getUTCFullYear();
}

export const isSameMonth = (a, b) => {
    return a.getUTCFullYear() === b.getUTCFullYear() &&
        a.getUTCMonth() === b.getUTCMonth();
}

export const isSameDay = (a, b) => {
    return a.getUTCFullYear() === b.getUTCFullYear() &&
        a.getUTCMonth() === b.getUTCMonth() &&
        a.getUTCDate() === b.getUTCDate();
}

export const isSameHour = (a, b) => {
    return a.getUTCFullYear() === b.getUTCFullYear() &&
        a.getUTCMonth() === b.getUTCMonth() &&
        a.getUTCDate() === b.getUTCDate() &&
        a.getUTCHours() === b.getUTCHours();
}