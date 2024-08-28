function getUrl() {
    if (typeof window !== "undefined") {
        // Client-side-only code
        const { protocol, hostname } = window.location;
        return `${protocol}//${hostname}`;
    } else {
        // Server-side-only code
        return "itsbrokedontfixit";
    }
}

export default getUrl;