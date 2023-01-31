<script lang="ts">
    import IamVisualizer from "$lib/iam-visualizer/IamVisualizer.svelte";
    import { nodeStore } from "../../stores/nodes/nodes";
    import { iconStore } from "../../stores/icons/icons";

    var selectedNodeTable = nodeStore.getters.getSelectedNodeTable();

    async function initGraphData() {
        await nodeStore.actions.fetchNodes(selectedNodeTable);
        await iconStore.actions.fetchIcons();
    }
</script>

{#await initGraphData()}
    <div class="flex justify-center items-center" id="spinner">
        <button class="btn loading" id="loading-btn">loading</button>
    </div>
{:then value}
    <IamVisualizer />
{:catch error}
    <p>Something went wrong: {error.message}</p>
{/await}

<style>
    #loading-btn {
        width: 40vh;
        height: 5vh;
    }
    #spinner {
        height: 90vh;
    }
</style>
