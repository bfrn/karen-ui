import {
    saveFile,
} from "../../stores/nodes/nodes";
import { fetchParsedFile } from "./preprocessor";
import { checkFileType } from "./typecheck";
import { FileType } from "./types";

export async function uploadFile(files: File[], url: string = "", fileType: FileType | null = null, filename: string | null = null): Promise<File[]> {
    for (const file of files) {
        const content = await file.text();
        if (filename === null) {
            filename = file.name;
        }

        if (fileType === null) {
            fileType = checkFileType(content);
        }

        console.log(fileType)

        switch (fileType) {
            case FileType.Karen:
                await save(content, filename);
                break;
            case FileType.Plan:
                handlePlanFile(content, filename, url);
                break;
            case FileType.State:
                await handleStateFile(content, filename);
                break;
            case FileType.Undefined:
                console.error("Unknown file type");
            default:
                break;
        }
    }
    return files
}


async function handleStateFile(content: string, filename: string) {
    const response = await fetchParsedFile(content, FileType.State);
    content = JSON.stringify(response);
    save(content, filename);
}
async function handlePlanFile(content: string, filename: string, url: string) {
    const response = await fetchParsedFile(content, FileType.Plan, url);
    content = JSON.stringify(response);
    save(content, filename);
}

async function save(content: string, filename: string, customNamespaceName: string = "") {
    try {
        let namespace = filename;
        if (customNamespaceName !== "") {
            namespace = customNamespaceName;
        }
        await saveFile(namespace, content);
    } catch (error) {
        console.error(error);
    }
}




