<script lang="ts">
    import {
        fetchNamespaces,
        dropNamespace as storeDropNamespace,
    } from "../../stores/nodes/nodes";
    import { FileType } from "$lib/files/types";
    import { uploadFile } from "$lib/files/upload";
    import { checkFileType } from "$lib/files/typecheck";

    let files: FileList;
    let fetchNamespacePromise = fetchNamespaces();
    let customNamespaceName: string|null = null;
    let fileType: FileType|null = null;
    let url = "";
    let formSubmitted = false;

    let handleFileUpload = (event: any) => {
        const fileList = event.target.files;
        const file = fileList[0]; // Assuming only one file is selected
        console.log("kek")
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            // Process the file content here
            if (content !== null && content !== undefined) {
                fileType = checkFileType(content.toString());
            }
        };
        reader.readAsText(file);
    };

    let submitForm = async () => {
        if (fileType === FileType.Plan && !url) {
            formSubmitted = true;
            return false; // Prevent form submission
        }
        console.log("submit  " + fileType)
        await uploadFile(Array.from(files), url, fileType, customNamespaceName);
        refetchNamespaces()
    };

    let dropNamespace = async (namespace: string) => {
        try {
            await storeDropNamespace(namespace);
            refetchNamespaces();
        } catch (error) {
            console.error(error);
        }
        // storeDropNamespace(namespace)
        //     .then((_) => refetchNamespaces())
        //     .catch((error) => console.error(error));
    };

    let refetchNamespaces = () => {
        fetchNamespacePromise = fetchNamespaces();
    };
</script>

<template>
    <input
        type="file"
        accept=".json"
        bind:files
        class="file-input file-input-bordered ml-4 mt-4"
        autocomplete="off"
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
                        <button class="btn" type="submit">Save</button>
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
