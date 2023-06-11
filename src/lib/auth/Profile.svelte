<script lang="ts">
    import { page } from "$app/stores";
</script>

<div class="dropdown dropdown-end">
    {#if $page.data.session}
        {#if $page.data.session.user?.image}
            <div class="form-group">
                <label
                    for="custom-input"
                    tabIndex={0}
                    class="btn btn-ghost btn-circle avatar w-10 rounded-full"
                >
                    <div class="w-10 rounded-full">
                        <img
                            src={$page.data.session.user.image}
                            alt="profile img"
                        />
                    </div>
                </label>
                <ul
                    tabIndex={0}
                    class="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
                >
                    <li>
                        <a
                            href="/auth/signout"
                            data-sveltekit-preload-data="off">Logout</a
                        >
                    </li>
                </ul>
            </div>
        {/if}
    {:else}
        <a href="/auth/signin" class="btn" data-sveltekit-preload-data="off">
            Sign in
        </a>
    {/if}
</div>
