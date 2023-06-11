<script lang="ts">
    import { goto } from "$app/navigation";
    import { uploadFile } from "$lib/files/upload";
    import Dropzone from "svelte-file-dropzone/Dropzone.svelte";
    import { nodeStore } from "../../stores/nodes/nodes";

    let files: File[];

    async function handleFilesSelect(e: any) {
        files = e.detail.acceptedFiles;
        await uploadFile(files);
        nodeStore.actions.setSelectedNodeTable(files[0].name);
        goto("/modules/iam-visualizer");
    }
    const okColor = "#519903";
    const outColor = "#3E65FA";

    let color = outColor;

    function handleMouseOver(e) {
        color = okColor;
    }
    function handleMouseOut(e) {
        color = outColor;
    }
</script>

<div
    class="dragdrop-zone z-50 w-4/5"
    on:mouseenter={handleMouseOver}
    on:mouseleave={handleMouseOut}
>
    <Dropzone
        on:drop={handleFilesSelect}
        accept="application/json"
        multiple={false}
        containerStyles="border-style: dashed; border-color: {color}; color: {color}"
    >
        <div class="flex items-center">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                class="dragdrop mr-6"
                width="32px"
                height="32px"
                fill-rule="evenodd"
                clip-rule="evenodd"
                image-rendering="optimizeQuality"
                shape-rendering="geometricPrecision"
                text-rendering="geometricPrecision"
            >
                <path
                    fill={color}
                    d="M257 7c137,0 249,111 249,249 0,137 -111,249 -249,249 -137,0 -249,-111 -249,-249 0,-137 111,-249 249,-249z"
                />
                <path
                    fill="#e6e6e6"
                    d="M257 117l0 0c8,0 15,7 15,15l0 108 108 0c8,0 15,7 15,15l0 0c0,8 -7,15 -15,15l-108 0 0 108c0,8 -7,15 -15,15l0 0c-8,0 -15,-7 -15,-15l0 -108 -108 0c-8,0 -15,-7 -15,-15l0 0c0,-8 7,-15 15,-15l108 0 0 -108c0,-8 7,-15 15,-15z"
                />
            </svg>
            <h3>Start free visualization</h3>
            <p>Drag & Drop your terraform state file</p>
        </div>
    </Dropzone>
</div>

<style>
    .dragdrop-zone:hover .dragdrop {
        transform: scale(1.2);
    }
    .dragdrop-zone {
        transition: all 1s;
        transition-timing-function: cubic-bezier(.17,.67,.91,.39);
        transform-origin: 50% 50%;
    }
</style>
