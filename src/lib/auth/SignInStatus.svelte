<script lang="ts">
    import { page } from "$app/stores";
</script>

<div class="flex bg-base-200">
    {#if $page.data.session}
        {#if $page.data.session.user?.image}
            <div
                class=""
                style="background-image: url('{$page.data.session.user
                    .image}');background-size: cover; background-repeat: no-repeat; height: 64px; width: 64px"
            />
        {/if}
        <span class="card pace-items-center p-2">
            <small>Signed in as</small><br />
            <strong
                >{$page.data.session.user?.email ??
                    $page.data.session.user?.name}</strong
            >
        </span>
        <div class="card">
            <a
                href="/auth/signout"
                class="btn flex-1"
                data-sveltekit-preload-data="off">Sign out</a
            >
        </div>
    {:else}
        <div class="card pace-items-center p-2">You are not signed in</div>
        <a href="/auth/signin" class="btn" data-sveltekit-preload-data="off">
            Sign in
        </a>
    {/if}
</div>
