<script lang="ts">
    import { fetchParsedStateFile } from "$lib/api/preprocessor";
    import {
        saveFile,
    } from "../../../stores/nodes/nodes";

    let files: FileList | undefined = undefined;
    let customNamespaceName = "";

    async function uploadFile() {
        if (files !== undefined && files[0]) {
            const text = await files[0].text();
            const filename = files[0].name;

            try {
                // TODO: remove this debug log
                console.log(text);
                
                // Post the state file to preprocessor and wait for karen-intermediate format
                let parsedFileJsonObject = await fetchParsedStateFile(text);
                let namespace = filename;
                if (customNamespaceName !== "") {
                    namespace = customNamespaceName;
                }

                // TODO: remove this debug log
                console.log(parsedFileJsonObject);
    
                let parsedFileJsonString = JSON.stringify(parsedFileJsonObject)
                await saveFile(namespace, parsedFileJsonString);

            } catch (error) {
                console.error(error);
            }
        }
    }
</script>

<template>
    <input
        type="file"
        accept=".json"
        bind:files
        class="file-input file-input-bordered ml-4 mt-4"
    />

    <div class="form-control mt-4 ml-4">
        <div class="input-group">
            <input
                type="text"
                placeholder="Filname..."
                class="input input-bordered"
                bind:value={customNamespaceName}
            />
            <div
                data-tip="If no name is provided the filename will be used"
                class="tooltip"
            >
                <button class="btn" on:click={uploadFile}>Parse</button>
            </div>
        </div>
    </div>
</template>
