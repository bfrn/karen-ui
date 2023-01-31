<script lang="ts">
    import { tarjan } from "./logic/tarjan";
    import { iamViusalizerState } from "./logic/node-store-ui-state";

    export let cy: cytoscape.Core;
    export let nodeId: string | undefined = undefined;
    export let edgeIdArnSeperator: string;

    let showCycles: boolean = false;

    iamViusalizerState.currentUiStateWritable.subscribe((uiState) => {
        if (nodeId === undefined) {
            showCycles = uiState.globalCycleButton;
        } else {
            showCycles = uiState.nodeCycleButton;
        }
    });

    function lookupCycles() {
        if (!showCycles) {
            computeCycles();
            showCycles = true;
        } else {
            cy.elements().removeClass("fadedOut");
            showCycles = false;
        }

        if (nodeId === undefined) {
            iamViusalizerState.setGlobalCycleButton(showCycles);
        } else {
            iamViusalizerState.setNodeCycleButton(showCycles);
        }
    }

    function computeCycles() {
        let sccsElements: Set<string>;
        const nodes = cy
            .filter((elem) => elem.isNode())
            .map((elem) => elem.id());
        const edges = cy
            .filter((elem) => elem.isEdge())
            .map((elem) => elem.id());

        if (nodeId !== undefined) {
            sccsElements = tarjan(nodes, edges, edgeIdArnSeperator, [
                nodeId,
            ]).reduce((acc, elem) => {
                elem.forEach((graphElemId) => acc.add(graphElemId));
                return acc;
            }, new Set<string>());
        } else {
            sccsElements = tarjan(nodes, edges, edgeIdArnSeperator, []).reduce(
                (acc, elem) => {
                    elem.forEach((graphElemId) => acc.add(graphElemId));
                    return acc;
                },
                new Set<string>()
            );
        }
        visualizeCycles(sccsElements);
    }

    function visualizeCycles(sccsElements: Set<string>) {
        cy.startBatch();
        cy.elements().removeClass("fadedOut");
        cy.filter((elem) => !sccsElements.has(elem.id())).addClass("fadedOut");
        cy.endBatch();
    }
</script>

<div class="mt-4">
    <div class="form-control">
        <div>
            <input
                on:click={lookupCycles}
                type="checkbox"
                class="toggle toggle-primary align-middle mr-3"
                bind:checked={showCycles}
            />
            <span class="label-text align-middle">Show cycles</span>
        </div>
    </div>
</div>
