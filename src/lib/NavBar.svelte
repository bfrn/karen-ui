<script lang="ts">
  import SignInStatus from "./auth/SignInStatus.svelte";
  import { clickOutside, clickOutsideAction } from "$lib/actions/clickOutside";
  import { page } from "$app/stores";
    import { goto } from "$app/navigation";

  let y: number;

  let position = "relative";
  let homeHref = "/";
  let isHome = false
  if ($page.route.id === "/") {
    position = "fixed";
    homeHref = "#top";
    isHome = true
  }

  function goHome() {
    
    if ($page.route.id === "/") {
      document.body.scrollIntoView();
    } else{
      goto("/")
    }
  }

  let navFloat = false;
  $: navFloat = y > 10;

  let showMenu = false;
  const toggleMenu = () => (showMenu = !showMenu);
  let hambugerEl: HTMLElement;

  const onClickOutsideAction = ({ target }) => {
    if (!hambugerEl.contains(target)) showMenu = false;
  };
  const onClickOutside = ({
    detail: {
      event: { target },
    },
  }) => {
    if (!hambugerEl.contains(target)) showMenu = false;
  };
</script>

<svelte:window bind:scrollY={y} />

<nav
  id="header"
  class={`
  ${position} w-full z-50 top-0 text-white
  ${navFloat && "bg-white"}
  `}
>
  <div
    class="w-full container mx-auto flex flex-wrap items-center justify-between mt-0 py-2"
  >
    <div class="pl-4 flex items-center">
      <!-- svelte-ignore a11y-invalid-attribute -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <a
        class:text-gray-800={navFloat||!isHome}
        class:text-white={!navFloat&&isHome}
        class="no-underline hover:no-underline font-bold text-2xl lg:text-4xl"
        href="#"
        on:click={goHome}
      >
        <div class="w-16">
          <img src="/terralens.png" alt="logo" />
        </div>
        TerraLens
      </a>
    </div>
    <div bind:this={hambugerEl} class="block lg:hidden pr-4">
      <button
        on:click={toggleMenu}
        id="nav-toggle"
        class="flex items-center p-1 text-pink-800 hover:text-gray-900 focus:outline-none focus:shadow-outline transform transition hover:scale-105 duration-300 ease-in-out"
      >
        <svg
          class="fill-black h-6 w-6"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>TerraLens</title>
          <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
        </svg>
      </button>
    </div>
    <div
      use:clickOutside
      on:clickOutside={onClickOutside}
      class:hidden={!showMenu}
      class="hidden w-full flex-grow lg:flex lg:items-center lg:w-auto mt-2 lg:mt-0 bg-white lg:bg-transparent text-black p-4 lg:p-0 z-20"
      id="nav-content"
    >
      <ul class="list-reset lg:flex justify-end flex-1 items-center">
        <li class="mr-3">
          <!-- svelte-ignore a11y-invalid-attribute -->
          <a
            class="inline-block text-black no-underline hover:text-green-800 hover:text-underline py-2 px-4"
            href="/modules">Modules</a
          >
        </li>
        <li class="mr-3">
          <!-- svelte-ignore a11y-invalid-attribute -->
          <a
            class="inline-block text-black no-underline hover:text-green-800 hover:text-underline py-2 px-4"
            href="/files">Upload</a
          >
        </li>
      </ul>
      <SignInStatus />
    </div>
  </div>
  <hr class="border-b border-gray-100 opacity-25 my-0 py-0" />
</nav>
