<script lang="ts">
    import { page } from "$app/stores";
    import Profile from "./Profile.svelte";
</script>

<div class="flex bg-base-100">
    {#if $page.data.session}
        {#if $page.data.session.user?.image}
            <Profile />
        {/if}
    {:else}
        <a href="/auth/signin" class="btn" data-sveltekit-preload-data="off">
            Sign in
        </a>
    {/if}
</div>
