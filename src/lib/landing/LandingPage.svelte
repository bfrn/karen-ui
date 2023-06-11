<script lang="ts">
	import Hero from './Hero.svelte';
	import Footer from './Footer.svelte';
    import NavBar from './NavBar.svelte';
</script>

<div
	class="leading-normal tracking-normal text-white gradient"
	style="font-family: 'Source Sans Pro', sans-serif;"
>
	<NavBar/>
	<Hero />
	<Footer />
</div>

<style>
	.gradient {
		@apply bg-gradient-to-r from-primary to-secondary;
	}
</style>
