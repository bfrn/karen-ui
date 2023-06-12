<script lang="ts">
    import { page } from "$app/stores";
    import Button from "$lib/Button.svelte";
    import Profile from "./Profile.svelte";
</script>

<div class="flex">
    {#if $page.data.session}
        {#if $page.data.session.user?.image}
            <Profile />
        {/if}
    {:else}
        <a 
        href="/auth/signin" 
        rel="external"
        data-sveltekit-preload-data="off">
            <Button center={false}>Sign in</Button>
        </a>
    {/if}
</div>
