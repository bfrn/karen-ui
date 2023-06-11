<script lang="ts">
    import { error } from "@sveltejs/kit";
    import {
        saveFile,
        fetchNamespaces,
        dropNamespace as storeDropNamespace,
    } from "../../stores/nodes/nodes";
    import { fetchParsedFile } from "$lib/files/preprocessor";
    import { checkFileType } from "$lib/files/typecheck";
    import { FileType } from "$lib/files/types";

    let files: FileList | undefined = undefined;
    let fetchNamespacePromise = fetchNamespaces();
    let customNamespaceName = "";
    let fileType = FileType.Undefined;
    let url = "";
    let formSubmitted = false;

    function refetchNamespaces() {
        fetchNamespacePromise = fetchNamespaces();
    }

    let submitForm = () => {
        if (fileType === FileType.Plan && !url) {
            formSubmitted = true;
            return false; // Prevent form submission
        }
        uploadFile()
    };

    async function uploadFile() {
        if (files !== undefined) {
            for (const file of files) {
                const content = await file.text();
                const filename = file.name;
                const fileType = checkFileType(content);

                switch (fileType) {
                    case FileType.Karen:
                        await save(content, filename);
                        break;
                    case FileType.Plan:
                        handlePlanFile(content, filename);
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
        }
    }
    async function handleStateFile(content: string, filename: string) {
        const response = await fetchParsedFile(content, fileType);
        content = JSON.stringify(response);
        save(content, filename);
    }
    async function handlePlanFile(content: string, filename: string) {
        const response = await fetchParsedFile(content, fileType, url);
        content = JSON.stringify(response);
        save(content, filename);
    }

    async function save(content: string, filename: string) {
        try {
            let namespace = filename;
            if (customNamespaceName !== "") {
                namespace = customNamespaceName;
            }
            await saveFile(namespace, content);
            refetchNamespaces();
        } catch (error) {
            console.error(error);
        }
    }

    function handleFileUpload(event: any) {
        const fileList = event.target.files;
        const file = fileList[0]; // Assuming only one file is selected

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            // Process the file content here
            if (content !== null && content !== undefined) {
                fileType = checkFileType(content.toString());
            }
        };
        reader.readAsText(file);
    }

    async function dropNamespace(namespace: string) {
        try {
            await storeDropNamespace(namespace);
            refetchNamespaces();
        } catch (error) {
            console.error(error);
        }
        // storeDropNamespace(namespace)
        //     .then((_) => refetchNamespaces())
        //     .catch((error) => console.error(error));
    }
</script>

<template>
    <input
        type="file"
        accept=".json"
        bind:files
        class="file-input file-input-bordered ml-4 mt-4"
        on:change={handleFileUpload}
        on:input={handleFileUpload}
    />

    <div class="form-control mt-4 ml-4">
        <form on:submit|preventDefault={submitForm}>
            <div class="w-1/3">
                <div class="input-group">
                    <input
                        type="text"
                        placeholder="Filename..."
                        class="input input-bordered w-full"
                        bind:value={customNamespaceName}
                    />
                    <div
                        data-tip="If no name is provided the filename will be used."
                        class="tooltip"
                    >
                        <button class="btn" type="submit" >Save</button>
                    </div>
                </div>
            </div>
            {#if fileType === FileType.Plan}
                <div class="w-1/3">
                    <input
                        type="text"
                        placeholder="Enter terraform entrypoint url "
                        class="input input-bordered w-full mt-4"
                        bind:value={url}
                        required
                    />
                </div>
            {/if}
        </form>
    </div>

    <div class="overflow-x-auto m-4">
        <table class="table table-zebra w-full">
            <!-- head -->
            <thead>
                <tr>
                    <th />
                    <th>Filename</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#await fetchNamespacePromise}
                    <p>...waiting</p>
                {:then namespaces}
                    {#each namespaces as namespace, i}
                        <tr>
                            <th>{i + 1}</th>
                            <td>{namespace}</td>
                            <td>
                                <button
                                    class="btn btn-ghost btn-sm"
                                    on:click={async () =>
                                        await dropNamespace(namespace)}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke-width="1.5"
                                        stroke="currentColor"
                                        class="w-6 h-6"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                        />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    {/each}
                {:catch error}
                    <p style="color: red">{error.message}</p>
                {/await}
            </tbody>
        </table>
    </div>
</template>
