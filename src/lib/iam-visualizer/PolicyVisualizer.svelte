<script lang="ts">
    import { extractPolicies } from "./logic/policy-extractor";
    import type { Policy } from "./model/Policy";
    import { iamViusalizerState } from "./logic/node-store-ui-state";

    let policies: Policy[] = [];
    iamViusalizerState.nodeIdWriteable.subscribe((newNodeId) => {
        policies = extractPolicies(newNodeId);
    });
</script>

{#if policies.length > 0}
    <div class="vh-20 overflow-scroll border-2 rounded-md">
        {#each policies as policy, policiesIdx}
            <div>
                {#each policy.action as action, idx}
                    {#if idx === 0}
                        <p>
                            {policy.effect === "Allow" ? "✅" : "🚫"}
                            {action}
                        </p>
                    {:else}
                        <p class="ml-6">
                            {"\t"}
                            {`\t${action}`}
                        </p>
                    {/if}
                {/each}
                <ul class="list-disc list-inside ml-2">
                    {#each policy.resources || [] as resource}
                        <li>
                            {resource}
                        </li>
                    {/each}
                </ul>
            </div>
            {#if policiesIdx !== policies.length - 1}
                <div class="divider " style="w-full" />
            {/if}
        {/each}
    </div>
{:else}
    <p>No policies found</p>
{/if}

<style scoped>
    .vh-20 {
        height: 30vh;
    }
</style>
