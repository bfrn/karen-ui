<script lang="ts">
    import type cytoscape from "cytoscape";
    import { iamViusalizerState } from "./logic/node-store-ui-state";

    export let cy: cytoscape.Core;
    export let edgeIdArnSeperator: string;

    let nodeId: string;
    let showParents = false;
    let showGrandparents = false;
    let showChildren = false;
    let showGrandchildren = false;

    iamViusalizerState.currentUiStateWritable.subscribe((state) => {
        showParents = state.showParents;
        showGrandparents = state.showGrandparents;
        showChildren = state.showChildren;
        showGrandchildren = state.showGrandchildren;
    });

    iamViusalizerState.nodeIdWriteable.subscribe(
        (newNodeId) => (nodeId = newNodeId)
    );

    function toggleShowParents() {
        if (!showParents) {
            showParents = true;
        } else {
            showParents = false;
            if (showGrandparents) {
                showGrandparents = false;
            }
        }
        highlightNodes();
    }

    function toggleShowGrandparents() {
        if (!showGrandparents) {
            showGrandparents = true;
            if (!showParents) {
                showParents = true;
            }
        } else {
            showGrandparents = false;
        }
        highlightNodes();
    }

    function toggleShowChildren() {
        if (!showChildren) {
            showChildren = true;
        } else {
            showChildren = false;
            if (showGrandchildren) {
                showGrandchildren = false;
            }
        }
        highlightNodes();
    }

    function toggleShowGrandchildren() {
        if (!showGrandchildren) {
            showGrandchildren = true;
            if (!showChildren) {
                showChildren = true;
            }
        } else {
            showGrandchildren = false;
        }
        highlightNodes();
    }

    function highlightNodes() {
        cy.elements("*").removeClass("fadedOut");

        if (
            showParents ||
            showGrandparents ||
            showChildren ||
            showGrandchildren
        ) {
            const selectedNode = cy.$id(`${nodeId}`);
            const highlightedElements = selectedNode
                .connectedEdges()
                .reduce((acc, edge) => {
                    const splittedEdgeId = edge.id().split(edgeIdArnSeperator);
                    const parentArn = splittedEdgeId[0];
                    const childArn = splittedEdgeId[1];

                    if (
                        parentArn === childArn &&
                        (showParents ||
                            showGrandparents ||
                            showChildren ||
                            showGrandchildren)
                    ) {
                        acc.add(`${parentArn}${edgeIdArnSeperator}${childArn}`);
                    }

                    if (showParents || showGrandparents) {
                        if (parentArn !== nodeId) {
                            acc.add(
                                `${parentArn}${edgeIdArnSeperator}${childArn}`
                            );
                            acc.add(parentArn);
                            if (showGrandparents) {
                                const parentEdges = cy
                                    .$id(parentArn)
                                    .connectedEdges();
                                parentEdges.forEach((e) => {
                                    const parentEdgeId = e.id();
                                    const splittedParentEdgeId =
                                        parentEdgeId.split(edgeIdArnSeperator);
                                    const edgeParentArn =
                                        splittedParentEdgeId[0];
                                    if (
                                        splittedParentEdgeId[0] ===
                                        splittedParentEdgeId[1]
                                    ) {
                                        acc.add(parentEdgeId);
                                    }
                                    if (edgeParentArn !== parentArn) {
                                        acc.add(parentEdgeId);
                                        acc.add(edgeParentArn);
                                    }
                                });
                            }
                        }
                    }
                    if (showChildren || showGrandchildren) {
                        if (childArn !== nodeId) {
                            acc.add(
                                `${parentArn}${edgeIdArnSeperator}${childArn}`
                            );
                            acc.add(childArn);
                            if (showGrandchildren) {
                                const childEdges = cy
                                    .$id(childArn)
                                    .connectedEdges();
                                childEdges.forEach((e) => {
                                    const childEdgeId = e.id();
                                    const splittedChildEdgeId =
                                        childEdgeId.split(edgeIdArnSeperator);
                                    const edgeChildArn = splittedChildEdgeId[1];
                                    if (
                                        splittedChildEdgeId[0] ===
                                        splittedChildEdgeId[1]
                                    ) {
                                        acc.add(childEdgeId);
                                    }
                                    if (edgeChildArn !== childArn) {
                                        acc.add(childEdgeId);
                                        acc.add(edgeChildArn);
                                    }
                                });
                            }
                        }
                    }
                    return acc;
                }, new Set<string>());
            highlightedElements.add(nodeId);
            cy.filter((elem) => !highlightedElements.has(elem.id())).addClass(
                "fadedOut"
            );
        } else {
            cy.elements("*").removeClass("fadedOut");
        }

        iamViusalizerState.setRelativeButtons(
            showParents,
            showGrandparents,
            showChildren,
            showGrandchildren
        );
    }
</script>

<div class="mt-4">
    <div class="form-control">
        <div>
            <input
                on:click={toggleShowParents}
                type="checkbox"
                class="toggle toggle-primary align-middle mr-3"
                bind:checked={showParents}
            />
            <span class="label-text align-middle">Show parents</span>
        </div>
    </div>

    <div class="form-control mt-5">
        <div>
            <input
                on:click={toggleShowGrandparents}
                type="checkbox"
                class="toggle toggle-primary align-middle mr-3"
                bind:checked={showGrandparents}
            />
            <span class="label-text align-middle">Show grandparents</span>
        </div>
    </div>

    <div class="form-control mt-5">
        <div>
            <input
                on:click={toggleShowChildren}
                type="checkbox"
                class="toggle toggle-primary align-middle mr-3"
                bind:checked={showChildren}
            />
            <span class="label-text align-middle">Show children</span>
        </div>
    </div>

    <div class="form-control mt-5">
        <div>
            <input
                on:click={toggleShowGrandchildren}
                type="checkbox"
                class="toggle toggle-primary align-middle mr-3"
                bind:checked={showGrandchildren}
            />
            <span class="label-text align-middle">Show grandchildren</span>
        </div>
    </div>
</div>
