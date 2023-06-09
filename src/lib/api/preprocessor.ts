const url = "http://localhost:3000"


export async function fetchParsedStateFile(stateFile:string): Promise<string> {
    const encoder = new TextEncoder();
    // Encode the JSON string to a Uint8Array
    const jsonBytes = encoder.encode(stateFile);
    const response = await fetch(
        url + "/",
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
                },
            body: jsonBytes
        }
        )
    return await response.json()
}
