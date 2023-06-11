<script lang="ts">
    import { MenuCard } from "./menu-card";
    import { fetchNamespaces, nodeStore } from "../../stores/nodes/nodes";
    import { goto } from '$app/navigation';

    const cards = [
        new MenuCard(
            "/modules/iam-visualizer",
            "IAM-Visualizer",
            "Visualizes AWS-IAM relations."
        ),
    ];

    let selectedTable = "";
    function setSelectedNodeTable() {
        nodeStore.actions.setSelectedNodeTable(selectedTable);
    }
    async function fetchTableNames() {
        let namespaces = await fetchNamespaces();
        if (namespaces.length > 0) {
            selectedTable = namespaces[0];
            nodeStore.actions.setSelectedNodeTable(selectedTable);
        }
        return namespaces;
    }
</script>

<div class="flex flex-wrap gap-4 mt-4 ml-4">
    {#await fetchTableNames()}
        <p>...fetching namespaces</p>
    {:then namespaces}
        {#each cards as card}
            <div class="card w-96 bg-base-100 shadow-xl border-2 border-black">
                <div class="card-body">
                    <h2 class="card-title">{card.title}</h2>
                    <p>{card.description}</p>
                    <div class="card-actions">
                        {#if namespaces.length > 0}
                            <div class="form-control">
                                <div class="input-group">
                                    <select
                                        class="select select-bordered w-full"
                                        bind:value={selectedTable}
                                        on:change={() => setSelectedNodeTable()}
                                    >
                                        {#each namespaces as namepace, namespaceIdx}
                                            {#if namespaceIdx === 0}
                                                <option selected
                                                    >{namepace}</option
                                                >
                                            {:else}
                                                <option>{namepace}</option>
                                            {/if}
                                        {/each}
                                    </select>
                                    <button class="btn" on:click={ () => goto(card.route)}>
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
                                                d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        {:else}
                            <div class="alert shadow-lg">
                                <div>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        class="stroke-info flex-shrink-0 w-6 h-6"
                                        ><path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        /></svg
                                    >
                                    <span>Please upload a data file!</span>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    {:catch error}
        <p>Something went wrong: {error.message}</p>
    {/await}
</div>

<style>
</style>
