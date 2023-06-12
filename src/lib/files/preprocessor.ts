const preprocessorURL = "https://terralens-preprocessor.onrender.com"

interface ParseFileRequestData {
    data: string;
    type: string;
    url: string | null;
}

export async function fetchParsedFile(content: string,fileType:string, terraformEntrypointURL: string|null = null): Promise<string> {
    const requestData: ParseFileRequestData = {
        data: content,
        type: fileType,
        url: terraformEntrypointURL
    };
    const response = await fetch(
        preprocessorURL + "/parse",
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        }
    )
    return await response.json()
}
