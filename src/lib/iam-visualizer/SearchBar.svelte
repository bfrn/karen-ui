<script lang="ts">
    import type cytoscape from "cytoscape";
    import { iamViusalizerState } from "./logic/node-store-ui-state";
    import { extractPolicies } from "./logic/policy-extractor";

    export let cy: cytoscape.Core;

    enum SearchMode {
        CaseSensitiveSearch,
        RegexSearch,
        ResourceSearch,
    }
    
    let searchMode = SearchMode.CaseSensitiveSearch;

    let inputText = "";

    function search() {
        iamViusalizerState.resetAllButtons();
        if (searchMode === SearchMode.ResourceSearch) {
            searchResources();
        } else {
            searchNodes();
        }
    }

    function searchNodes() {
        const inputValue = inputText;
        var regex: RegExp;
        if (searchMode === SearchMode.RegexSearch) {
            try {
                regex = new RegExp(inputValue, "i");
            } catch (error) {
                if (error instanceof SyntaxError) {
                    alert(`Regular expression is invalid: ${error.message}`);
                } else {
                    alert(
                        `Regular expression object could not be created: ${error}`
                    );
                }
                return;
            }
        }
        if (inputValue !== "") {
            cy.startBatch();
            cy.elements("*").removeClass("fadedOut");
            cy.filter((elem) => {
                const nameAttr = elem.attr("name");
                if (nameAttr !== undefined) {
                    const nodeName = nameAttr as string;
                    if (searchMode === SearchMode.RegexSearch) {
                        return nodeName.match(regex) === null;
                    } else {
                        return nodeName !== inputValue;
                    }
                } else {
                    return true;
                }
            }).addClass("fadedOut");
            cy.endBatch();
        }
    }

    function searchResources() {
        let nodesToHighlight: Set<string> = new Set();
        let inputValue = inputText;
        inputValue = inputValue.replaceAll("?", ".");
        inputValue = inputValue.replaceAll("*", ".*");

        var regex: RegExp;
        try {
            regex = new RegExp(inputValue, "i");
        } catch (error) {
            if (error instanceof SyntaxError) {
                alert(`Regular expression is invalid: ${error.message}`);
            } else {
                alert(
                    `Regular expression object could not be created: ${error}`
                );
            }
            return;
        }
        const nodeIds = cy
            .filter((elem) => elem.isNode())
            .map((elem) => elem.id());

        for (let nodeId of nodeIds) {
            const policies = extractPolicies(nodeId);
            for (let policy of policies) {
                const resources = policy.resources;
                if (resourceContainsArn(resources, regex)) {
                    nodesToHighlight.add(nodeId);
                    break;
                }
            }
        }
        cy.startBatch();
        cy.elements("*").removeClass("fadedOut");
        cy.filter((elem) => !nodesToHighlight.has(elem.id())).addClass(
            "fadedOut"
        );
        cy.endBatch();
    }

    function resourceContainsArn(
        resources: string[] | undefined,
        regex: RegExp
    ) {
        if (resources !== undefined) {
            for (let resource of resources) {
                if (resource.match(regex)) {
                    return true;
                }
            }
        }
        return false;
    }

    function resetHighlighting() {
        iamViusalizerState.resetAllButtons();
        cy.elements("*").removeClass("fadedOut");
    }
</script>

<div class="form-control mt-4">
    <div class="input-group place-self-center">
        <input
            type="text"
            placeholder="Search…"
            class="input input-bordered w-full"
            bind:value={inputText}
        />
        <button class="btn btn-square btn-outline" on:click={resetHighlighting}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                /></svg
            >
        </button>
        <button class="btn btn-square btn-outline " on:click={search}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                /></svg
            >
        </button>
    </div>
</div>

<div class="w-3/6 mt-4">
    <div class="form-control">
        <label class="label cursor-pointer ">
            <span class="label-text">Case sensitive search</span>
            <input
                type="radio"
                name="radio-10"
                class="radio radio-primary"
                bind:group={searchMode}
                value={SearchMode.CaseSensitiveSearch}
            />
        </label>
    </div>
    <div class="form-control">
        <label class="label cursor-pointer ">
            <span class="label-text">Regex search</span>
            <input
                type="radio"
                name="radio-10"
                class="radio radio-primary"
                bind:group={searchMode}
                value={SearchMode.RegexSearch}
            />
        </label>
    </div>
    <div class="form-control">
        <label class="label cursor-pointer ">
            <span class="label-text ">Resource search</span>
            <input
                type="radio"
                name="radio-10"
                class="radio radio-primary"
                bind:group={searchMode}
                value={SearchMode.ResourceSearch}
            />
        </label>
    </div>
</div>
