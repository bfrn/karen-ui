<script lang="ts">
    import cytoscape from "cytoscape";
    import { onMount } from "svelte";
    import {
        getPrincipalRelations,
        getPrincipalGraph,
        getNodeIcon,
    } from "./logic/node-transformator";
    import PolicyVisualizer from "./PolicyVisualizer.svelte";
    import SearchBar from "./SearchBar.svelte";
    import ShowCycles from "./ShowCycles.svelte";
    import VisualizeRelativesButtons from "./VisualizeRelativesButtons.svelte";
    import { iamViusalizerState } from "./logic/node-store-ui-state";

    let edgeIdArnSeperator = "<=>";
    let nodeId = "";

    iamViusalizerState.nodeIdWriteable.subscribe(
        (newNodeId) => (nodeId = newNodeId)
    );

    iamViusalizerState.currentUiState;

    var cy: cytoscape.Core;
    onMount(() => {
        iamViusalizerState.resetAllButtons();
        iamViusalizerState.nodeIdWriteable.set("");
        
        cy = cytoscape({
            container: document.getElementById("cy"),
            elements: [],
            style: [
                {
                    selector: ".selectedNode",
                    style: {
                        "background-color": "#ff8c00",
                        "background-opacity": 1,
                        opacity: 1.0,
                    },
                },
                {
                    selector: "node",
                    style: {
                        "background-color": "#ffffff",
                        "background-opacity": 0,
                        width: "48px",
                        height: "48px",
                        shape: "rectangle",
                        content: "data(name)",
                        "font-size": "8px",
                        "text-valign": "bottom",
                        "text-halign": "center",
                        "text-outline-color": "#555",
                        "text-outline-width": "2px",
                        color: "#fff",
                        "overlay-padding": "6px",
                        "background-image":
                            "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2248%22%20height%3D%2248%22%20fill%3D%22currentColor%22%20class%3D%22bi%20bi-file-earmark%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M14%204.5V14a2%202%200%200%201-2%202H4a2%202%200%200%201-2-2V2a2%202%200%200%201%202-2h5.5L14%204.5zm-3%200A1.5%201.5%200%200%201%209.5%203V1H4a1%201%200%200%200-1%201v12a1%201%200%200%200%201%201h8a1%201%200%200%200%201-1V4.5h-2z%22%2F%3E%3C%2Fsvg%3E",
                        "z-index": 10,
                    },
                },
                {
                    selector: ":selected",
                    css: {
                        "border-color": "#ff8c00",
                        "border-width": "3px",
                    },
                },
                {
                    selector: "edge",
                    style: {
                        width: 4,
                        "curve-style": "straight",
                        opacity: 0.8,
                        "line-color": "#666666",
                        "target-arrow-color": "#666666",
                        "target-arrow-shape": "triangle",
                    },
                },
                {
                    selector: ".fadedOut",
                    style: {
                        opacity: 0.1,
                    },
                },
            ],
        });
        const principalRelations = getPrincipalRelations();
        const principalGraph = getPrincipalGraph(principalRelations);
        cy.add(principalGraph);
        cy.filter((elem: any) => elem.isNode()).forEach((node: any) => {
            const nodeId: string = node.id();
            const icon = getNodeIcon(nodeId);
            node.style("background-image", icon);
        });
        cy.on("tap", (evt) => {
            let evtTarget = evt.target;
            if (evtTarget === cy) {
                iamViusalizerState.setNodeId("");
            } else {
                let newNodeId = evt.target.id();
                iamViusalizerState.setNodeId(newNodeId);
            }
        });

        var layout = cy.layout({
            name: "cose",
            idealEdgeLength: (edge) => 250,
            nodeOverlap: 20,
            refresh: 20,
            fit: true,
            padding: 430,
            randomize: false,
            componentSpacing: 100,
            nodeRepulsion: (edge) => 400000,
            edgeElasticity: (edge) => 100,
            nestingFactor: 5,
            gravity: 80,
            numIter: 1000,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1,
        });
        cy.minZoom(0.4);
        cy.maxZoom(2.9);
        layout.run();
    });
</script>

<div class="grid grid-cols-12 gap-3 max-h-95">
    <div class="col-span-9 border-r-2">
        <div id="cy" class="max-h-95" />
    </div>
    <div class="col-span-3 mr-4 overflow-scroll prose">
        <SearchBar bind:cy />
        <div class="divider" />
        <ShowCycles bind:cy bind:edgeIdArnSeperator />
        <div class="divider" />
        {#if nodeId !== ""}
            <p class="mt-4">{nodeId}</p>
            <div class="divider" />
            <VisualizeRelativesButtons bind:cy bind:edgeIdArnSeperator />
            <div class="divider " />
            <PolicyVisualizer />
        {:else}
            <div class="alert ">
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
                    <span>Please select a node in the graph!</span>
                </div>
            </div>
        {/if}
    </div>
</div>

<style scoped>
    .max-h-95 {
        height: 93vh;
    }
    #cy {
        background: #fff;
    }
</style>
