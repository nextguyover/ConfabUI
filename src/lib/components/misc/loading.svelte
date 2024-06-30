<script>
	import Fa from "svelte-fa/src/fa.svelte";
    import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
	import ConfabLogo from "../../icons/logo.svelte"
</script>

<div class="user-login-pending-container">
    <div class="user-login-pending-logo">
		<div class="user-login-pending-text">Comments by</div>
        <div class="confab-branding-logo" role="presentation" on:click={() => window.open("https://confabcomments.com")} ><ConfabLogo/></div>
    </div>
    <div class="user-login-pending-spinner">
        <Fa icon={faCircleNotch} spin size="2x" />
    </div>
</div>

<style>
	.user-login-pending-container {
		padding: 50px 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		opacity: 0.3;
		user-select: none;
	}

	.user-login-pending-logo {
		text-align: center;
		padding: 0px 0 20px 0;
		font-size: 2em;
	}

	.user-login-pending-text {
		font-family: "Questrial", sans-serif;
		font-size: 0.6em;
		padding: 3px 0;
		margin-bottom: 6px;
	}

	.confab-branding-logo {
		cursor: pointer;
		width: 130px;
	}
</style>