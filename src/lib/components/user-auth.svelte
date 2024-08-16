<script>
	let browser;

	import { createLoadObserver } from "./misc/util.js";
	import { getContext, onMount } from "svelte";

	import Fa from "svelte-fa/src/fa.svelte";
	import { faKey, faRightToBracket, faSpinner, faArrowLeft, faHashtag, faCheck, faXmark, faCircleNotch, faUser, faEnvelope, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

	import ConfabLogo from "../icons/logo.svelte"
    import Loading from "./misc/loading.svelte";

	export let rootActions;
	export let userData;
	export let apiAvailable;
	export let isAuthenticated = false;
	export let refreshUserAuth = false;

    const PUBLIC_API_URL = getContext("PUBLIC_API_URL");

	let loginState = "awaitingApi"; //email, code, pending, authenticated, unavailable, awaitingApi

    $: {
		if(refreshUserAuth !== undefined)
			loginState = apiAvailable === "pending" ? "awaitingApi" : 
				apiAvailable === false ? "unavailable" : 
				"pending";
	}

	const UserRole = {
		Standard: 0,
		Admin: 1,
	};

	let email;
	let emailInvalid;
	let emailLoading;
	let emailError;

	let verificationCode;
	let verificationCodeInvalid;
	let verificationCodeLoading;

	let newVerificationCodeSentResetTimeout;
	let newVerificationCodeStatus = "ready"; //ready, pending, sent, fail

	let userNameEditValue;
	let userNameEditValueInvalid;
	let usernameEditValueLoading;

	let profilePicLoaded = false;

	let flashAuth = false;

	const onProfilePicLoad = createLoadObserver(() => {
		profilePicLoaded = true;
	});

	onMount(async () => {
		browser = true;

		const urlParams = new URLSearchParams(window.location.search);
		const emailParam = urlParams.get('Confab_email');
		const authCodeParam = urlParams.get('Confab_authCode');
		
		if(emailParam && authCodeParam){
			history.replaceState(null, "", window.location.origin + window.location.pathname);

			while(loginState !== "authenticated" && loginState !== "email" && loginState !== "unavailable"){
				await new Promise(r => setTimeout(r, 100));
			}

			if(loginState === "authenticated"){
				logout();
			}

			rootActions.scrollToAuthPanel();
			
			email = emailParam;
			verificationCode = authCodeParam;

			codeSubmit();
		}

		if(urlParams.get('Confab_notification_settings')){
			history.replaceState(null, "", window.location.origin + window.location.pathname);

			while(loginState !== "authenticated" && loginState !== "email" && loginState !== "unavailable"){
				await new Promise(r => setTimeout(r, 100));
			}
			
			rootActions.scrollToAuthPanel();
		}
	});

	$: emailInvalid = email ? false : false;
	$: emailError = email ? null : null;
	$: verificationCodeInvalid = verificationCode ? false : false;
	// $: userNameEditValueInvalid = userNameEditValue ? false: false;
	$: isAuthenticated = loginState === "authenticated";

	$: refreshUserDataOnPending(loginState);

	const refreshUserDataOnPending = async (loginStateDummy) => {
		if (loginState === "pending" && browser) {
			await refreshUserData();
		}
		if (loginState === "authenticated") {
			refreshDisplayedUsername();
		}
	};

	const refreshDisplayedUsername = () => {
		if (userData.username == null) {
			userNameEditValue = "Anonymous";
		} else {
			userNameEditValue = userData.username;
		}
	};

	const refreshUserData = async () => {
		if (localStorage.getItem("jwtToken") != null) {
			await fetch(PUBLIC_API_URL + "/user/get-info", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + localStorage.getItem("jwtToken"),
				},
			})
			.then((response) => {
				if (response.ok) {
					return response.json();
				}
				return Promise.reject(response);
			})
			.then((json) => {
				if(json.isAnon && !rootActions.getAnonCommentingEnabled()){
					localStorage.removeItem("jwtToken");
					loginState = "email";
					return;
				}

				rootActions.initUserData({
					email: json.email,
					userId: json.userId,
					username: json.username,
					role: json.role,
				});

				if(json.isAnon){
					loginState = "email";
				} else {
					loginState = "authenticated";
					getChangeUsernameEnabled();
				}
			})
			.catch(() => {
				localStorage.removeItem("jwtToken");
				loginState = rootActions.getAnonCommentingEnabled() ? "anonymous" : "email";
			});
		} else {
			loginState = rootActions.getAnonCommentingEnabled() ? "anonymous" : "email";
		}
	};

	const LoginOutcome =
    {
        Success: 0,
        EmailInvalidFailure: 1,
        EmailUserBannedFailure: 2,
        EmailCodeRequestRateLimitFailure: 3,
        EmailGenericFailure: 4,
        VerificationCodeInvalidFailure: 5,
        VerificationCodeExpiredFailure: 6,
        VerificationCodeGenericFailure: 7,
        VerificationEmailsRateLimit: 8,
        AuthenticationDisabled: 9,
        MaxNewSignupsLimitFailure: 10,
    }

	const emailSubmit = async () => {
		let emailRegex = new RegExp(/^\S+@\S+\.\S+$/);

		if (!emailRegex.test(email)) {
			emailInvalid = true;
			emailError = "Invalid Email";
			return;
		}

		emailLoading = true;
		clearTimeout(newVerificationCodeSentResetTimeout);
		newVerificationCodeStatus = "ready";
		verificationCode = "";

		let response, json;
		try {
			response = await fetch(PUBLIC_API_URL + "/user/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: email,
					location: rootActions.getCommentLocation(),
				}),
			});

			json = await response?.json();
		} catch{} finally {
			if (json?.outcome === LoginOutcome.EmailCodeRequestRateLimitFailure || response?.ok) {
				emailError = null;
				loginState = "code";
			}
			else if (json?.outcome === LoginOutcome.EmailInvalidFailure){
				emailError = "Invalid Email";
			}
			else if (json?.outcome === LoginOutcome.EmailUserBannedFailure){
				emailError = "This account has been banned";
			}
			else if (json?.outcome === LoginOutcome.VerificationEmailsRateLimit){
				emailError = "Verification code limit reached. Try again later.";
			}
			else if (json?.outcome === LoginOutcome.AuthenticationDisabled){
				emailError = "Login currently disabled. Try again later.";
			}
			else if (json?.outcome === LoginOutcome.MaxNewSignupsLimitFailure){
				emailError = "New logins have been temporarily limited. Try again later.";
			}
			else if (json?.outcome === LoginOutcome.EmailGenericFailure){
				emailError = json?.errorMessage;
			}
			else if(response?.status === 500){
				emailError = "Server error, please try again later.";
			}
			else{
				emailError = "Connection error. Try again later.";
			}
			emailLoading = false;
		}
	};

	const codeGoBack = () => {			//todo is this necessary?
		loginState = "email";
	};

	const requestNewCode = async () => {
		if(newVerificationCodeStatus !== "fail" && newVerificationCodeStatus !== "pending"){
			newVerificationCodeStatus = "pending";

			let response, json;
			try {
				response = await fetch(PUBLIC_API_URL + "/user/login", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: email,
						location: rootActions.getCommentLocation(),
					}),
				});
				
				json = await response?.json();
			} catch{} finally {
				if(response?.ok){
					newVerificationCodeStatus = "sent";
					
					clearTimeout(newVerificationCodeSentResetTimeout);
					newVerificationCodeSentResetTimeout = setTimeout(() => {
						newVerificationCodeStatus = "ready";
					}, 20000);

					return;
				}

				if (json?.outcome === LoginOutcome.EmailCodeRequestRateLimitFailure){
					newVerificationCodeStatus = "fail";
					setTimeout(() => {
						newVerificationCodeStatus = "ready";
					}, 10000);
				}
				else if (json?.outcome === LoginOutcome.EmailUserBannedFailure){
					loginState = "email";
					emailError = "This account has been banned";
				}
				else if (json?.outcome === LoginOutcome.VerificationEmailsRateLimit){
					loginState = "email";
					emailError = "Verification code limit reached. Try again later.";
				}
				else if (json?.outcome === LoginOutcome.AuthenticationDisabled){
					loginState = "email";
					emailError = "Login currently disabled. Try again later.";
				}
				else if (json?.outcome === LoginOutcome.EmailGenericFailure){
					loginState = "email";
					emailError = json.errorMessage;
				}
				else if(response?.status === 500){
					loginState = "email";
					emailError = "Server error, please try again later.";
				}
				else{
					loginState = "email";
					emailError = "Connection error. Try again later.";
				}
			}
		}
	};

	const codeSubmit = async () => {
		verificationCodeLoading = true;
		
		let response, json;
		try {
			response = await fetch(PUBLIC_API_URL + "/user/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: email,
					loginCode: verificationCode,
				}),
			})

			json = await response?.json();
		} catch{} finally {
			if(response?.ok){
				localStorage.setItem("jwtToken", json.token);

				email = "";
				verificationCode = "";

				verificationCodeLoading = false;
				loginState = "pending";

				return;
			}
			
			if (json?.outcome === LoginOutcome.EmailUserBannedFailure){
				loginState = "email";
				emailError = "This account has been banned";
			}
			else if (json?.outcome === LoginOutcome.EmailGenericFailure){
				loginState = "email";
				emailError = json.errorMessage;
			}
			else if(json?.outcome === LoginOutcome.VerificationCodeInvalidFailure || json?.outcome === LoginOutcome.VerificationCodeGenericFailure){
				verificationCodeLoading = false;
				verificationCodeInvalid = true;
			}
			else if(json?.outcome === LoginOutcome.VerificationCodeExpiredFailure){
				loginState = "email";
				emailError = "Verification code expired";
			}
			else if(json?.outcome === LoginOutcome.AuthenticationDisabled){
				loginState = "email";
				emailError = "Login currently disabled. Try again later.";
			}
			else if(response?.status === 500){
				loginState = "email";
				emailError = "Server error, please try again later.";
			}
			else{
				loginState = "email";
				emailError = "Connection error. Try again later.";
			}
			verificationCodeLoading = false;
		}
	};

	const getChangeUsernameEnabled = async () => {
		let response;
		try {
			response = await fetch(PUBLIC_API_URL + "/user/change-username", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + localStorage.getItem("jwtToken"),
				},
			});
		} catch{} finally {
			changeUsernameEnabled = response?.ok ? "enabled" : "disabled";
			refreshDisplayedUsername();
		}
	}

	let changeUsernameEnabled = "pending";

	$: userNameEditValue = stripNewlines(userNameEditValue);

	let usernameRef;

	let usernameCurrentlyEditing = false;
	$: usernameFeedback = userNameEditValue ? null : null;

	const stripNewlines = (str) => {
		return str?.replace(/\n|\r/g, "");
	};

	const usernameChangeFocus = async () => {
		if (userData.username == null) {
			userNameEditValue = "";
		}
		usernameCurrentlyEditing = true;
		usernameRef.focus();
	};

	const userNameEditHandleKeydown = async (event) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			usernameChange();
		}
	}

	const validateUserName = (userNameEditValue) => {
		if(userNameEditValue.length == 0) return true;

		if(userData.role == UserRole.Admin) return true;

		if (userNameEditValue.length < 2) {
			usernameFeedback = "Username must be at least 2 characters long";
			return false;
		}
		if (userNameEditValue.length > 15) {
			usernameFeedback = "Username must be less than 15 characters long";
			return false;
		}	
		if (!/^[a-zA-Z0-9_]+$/.test(userNameEditValue)) {
			usernameFeedback = "Username must contain only letters, numbers, and underscores";
			return false;
		}
		return true;
	}

	const usernameChange = async () => {
		if(!validateUserName(userNameEditValue)) return;

		usernameEditValueLoading = true;
		usernameRef.blur();

		let response;
		try {
			response = await fetch(PUBLIC_API_URL + "/user/change-username", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + localStorage.getItem("jwtToken"),
				},
				body: JSON.stringify({ newUsername: userNameEditValue }),
			});
		} catch{} finally {
			if(!response?.ok) {
				usernameEditValueLoading = false;
				userNameEditValueInvalid = true;
				setTimeout(() => {
					userNameEditValueInvalid = false;
				}, 2000);
			}

			if (response?.status === 429) {
				usernameFeedback = "You're doing that too much, try again later."
			}
			else if (response?.status === 409) {
				usernameFeedback = "Username is already taken."
			}
			else if (response?.status === 400) {
				usernameFeedback = "Invalid username."
			}
			else if(!response){
				usernameFeedback = "Connection error, try again later."
			}
			else {
				await refreshUserData();
				refreshDisplayedUsername();
				usernameFeedback = null;
				usernameEditValueLoading = false;
				usernameCurrentlyEditing = false;
			}
		}
	};

	const cancelUsernameChange = () => {
		usernameCurrentlyEditing = false;
		usernameFeedback = null;
		userNameEditValueInvalid = false;
		
		refreshDisplayedUsername();
	}

	const logout = () => {
		localStorage.removeItem("jwtToken");
		rootActions.initUserData(null);
		loginState = "email";
	};

	function flashElement() {
		if (flashAuth !== true) {
			flashAuth = true;
			setTimeout(() => {
				flashAuth = false;
			}, 5000);
		}
	}

	const mailboxJump = [
		{
			domains: [
				"gmail",
				"google",
			],
			jumpUrl: "https://mail.google.com/mail/u/?authuser="
		},
		{
			domains: [
				"outlook",
				"hotmail",
			],
			jumpUrl: "https://outlook.office.com/mail/"
		}
	];

	var mailboxJumpUrl;

	const checkMailboxJumpSupport = (email) => {
		for (const mailboxJumpItem of mailboxJump){
			for (const domain of mailboxJumpItem.domains){
				if(email.match("@" + domain + "\\.")){
					mailboxJumpUrl = mailboxJumpItem.jumpUrl + email;
					return true;
				}
			}
		}
		return false;
	};

	$: jumpToMailboxAvailable = email && checkMailboxJumpSupport(email);

	let replyNotificationsEnabled = null;
	let replyNotificationsPending = true;
	const setReplyNotifications = async (newState) => {
		if(!replyNotificationsPending && replyNotificationsEnabled !== newState){
            replyNotificationsPending = true;
            
            try{
                await fetch(PUBLIC_API_URL + "/user/reply-notifications", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                    body: JSON.stringify({
                        enabled: newState,
                    }),
                })
            } catch{} finally{
                await refreshReplyNotifications();
            }
        }
	}
	const refreshReplyNotifications = async () => {
		replyNotificationsPending = true;

		let response, json;
		try{
			response = await fetch(PUBLIC_API_URL + "/user/reply-notifications", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + localStorage.getItem("jwtToken"),
				}
			})
			json = await response.json();
		} catch{} finally{
			if(response?.ok && json){
				replyNotificationsEnabled = json.enabled;
			}else{
				replyNotificationsEnabled = null;
			}
			replyNotificationsPending = false;
		}
	}

	$: loginState === "authenticated" && refreshReplyNotifications();
</script>

<section id="confab-auth" on:flashElement={flashElement}>
	<div class="user-login-container" class:flash-auth={flashAuth}>
		<div class="user-login">
			{#if loginState == "pending" || loginState == "awaitingApi"}
				<Loading/>
			{:else if loginState == "email"}
				<div class="user-login-title">
					{#if rootActions.getAnonCommentingEnabled()}
						Sign in for more features
						<div class="user-login-subtitle">Receive reply notifications, change username, and more...</div>
						{:else}
						Enter email to start commenting
					{/if}
				</div>
				<div class="user-login-email">
					<form class="user-login-email-input-container">
						<input class="user-login-email-input" class:user-login-email-invalid={emailInvalid} placeholder="email@example.com" bind:value={email} />
						<div class="user-login-email-submit" class:user-login-email-submit-btn-hidden={!email}>
							<button class="user-login-email-submit-btn" aria-label="Email submit button" on:click|preventDefault={emailSubmit} disabled={emailLoading} class:user-login-email-submit-btn-disabled={emailLoading}>
								{#if !emailLoading}
									<Fa icon={faRightToBracket} />
								{:else}
									<Fa icon={faSpinner} spin />
								{/if}
							</button>
						</div>
					</form>
					{#if emailError}
						<div class="user-login-email-error">
							{emailError}
						</div>
					{/if}
					<div class="user-login-passwordless">
						<Fa icon={faKey} /> Passwordless login
					</div>
				</div>
			{:else if loginState == "code"}
				<div class="user-login-title">Enter the code that we've sent to your email</div>
				<div class="user-login-email">
					<div class="user-login-code-options-top">
						<div class="user-login-code-options-btn" role="button" tabindex="0" on:click={codeGoBack} on:keypress={codeGoBack}>
							<Fa icon={faArrowLeft} /> Go Back
						</div>
					</div>
					<form class="user-login-email-input-container">
						<input class="user-login-email-input" class:user-login-email-invalid={verificationCodeInvalid} placeholder="" bind:value={verificationCode} />
						<div class="user-login-email-submit" class:user-login-email-submit-btn-hidden={!verificationCode}>
							<button class="user-login-email-submit-btn" aria-label="Verification code submit button"  on:click|preventDefault={codeSubmit} disabled={verificationCodeLoading} class:user-login-email-submit-btn-disabled={verificationCodeLoading}>
								{#if !verificationCodeLoading}
									<Fa icon={faRightToBracket} />
								{:else}
									<Fa icon={faSpinner} spin />
								{/if}
							</button>
						</div>
					</form>
					<div class="user-login-code-options-bottom">
						{#if jumpToMailboxAvailable === true}
							<div class="user-login-code-options-btn" role="button" tabindex="0" on:click={() => window.open(mailboxJumpUrl, '_blank').focus()} on:keypress={() => window.open(mailboxJumpUrl, '_blank').focus()}>
								<Fa icon={faEnvelope} /> Open Your Mailbox
							</div>
						{/if}
						<div class="user-login-code-options-btn" class:user-login-code-options-btn-disabled={newVerificationCodeStatus == "pending" || newVerificationCodeStatus == "sent" || newVerificationCodeStatus == "fail"} role="button" tabindex="0" on:click={requestNewCode} on:keypress={requestNewCode}>
							{#if newVerificationCodeStatus == "ready"}
								<Fa icon={faHashtag} /> Get New Code
							{:else if newVerificationCodeStatus == "pending"}
								<Fa icon={faSpinner} spin /> Requesting New Code
							{:else if newVerificationCodeStatus == "sent"}
								<Fa icon={faCheck} /> New Code Sent!
							{:else if newVerificationCodeStatus == "fail"}
								<Fa icon={faXmark} /> Try Again Soon
							{/if}
						</div>
					</div>
					<div class="user-login-passwordless">
						<Fa icon={faKey} /> Passwordless login
					</div>
				</div>
			{:else if loginState == "authenticated"}
				<div class="user-auth-panel-options-top">
					{userData.email} •
					<span class="user-auth-panel-logout" role="button" tabindex="0" on:click={logout} on:keypress={logout}>Log Out</span>
				</div>

				<div class="user-auth-panel-profile-pic">
					<img use:onProfilePicLoad class="user-auth-panel-profile-pic-img" class:user-auth-panel-profile-pic-hidden={!profilePicLoaded} src={PUBLIC_API_URL + "/user/get-profile-picture/" + userData.userId} alt="Profile" />
					{#if !profilePicLoaded}
						<div class="user-auth-panel-profile-pic-placeholder">
							<Fa icon={faUser} />
						</div>
					{/if}
				</div>
				<div class="user-auth-panel-change-username-outer">
					Hi,
					{#if changeUsernameEnabled === "enabled"}
						<span bind:this={usernameRef} 
							on:drop={(e) => e.preventDefault()}
							class="user-auth-panel-change-username" 
							class:user-auth-panel-change-username-enabled={changeUsernameEnabled === "enabled"}
							class:user-auth-panel-change-username-error={userNameEditValueInvalid} 
							contenteditable="true" 
							bind:innerText={userNameEditValue} 
							on:focus={usernameChangeFocus}
							on:keydown={userNameEditHandleKeydown}
							role="textbox"
							tabindex="0"
						/>
					{:else}
						<span bind:this={usernameRef} class="user-auth-panel-change-username">
							{userNameEditValue}
						</span>
					{/if}
					{#if usernameEditValueLoading}
						<span class="user-auth-panel-change-username-first-btn user-auth-panel-change-username-btn" >
							<Fa icon={faSpinner} spin />
						</span>
					{:else if usernameCurrentlyEditing}
						<span class="user-auth-panel-change-username-btn user-auth-panel-change-username-first-btn" role="button" tabindex="0" on:click={usernameChange} on:keypress={usernameChange}>
							<Fa icon={faFloppyDisk} />
						</span>
						<span class="user-auth-panel-change-username-btn" role="button" tabindex="0" on:click={cancelUsernameChange} on:keypress={cancelUsernameChange}>
							<Fa icon={faXmark} />
						</span>
					{/if}
					{"​"}
				</div>                
				{#if usernameFeedback}
					<div class="user-auth-panel-change-username-feedback">
						{usernameFeedback}
					</div>
				{/if}
			{:else if loginState == "anonymous"}
				<div class="user-login-unavailable-login-btn" role="button" tabindex="0" on:click={() => loginState = "email"} on:keypress={() => loginState = "email"}>
					Go to login
				</div>
				<br/><br/>
				<div class="user-login-title">Join the conversation!</div>
				<br/>
			{:else if loginState == "unavailable"}
				<div class="user-login-unavailable-login-btn" role="button" tabindex="0" on:click={() => loginState = "email"} on:keypress={() => loginState = "email"}>
					Go to login
				</div>
				<br/><br/>
				<div class="user-login-title">Comments are unavailable right now. Please try again later.</div>
				<br/>
			{/if}
		</div>

		<div class="bottom-row">
			<div class="notification-preferences">
				{#if loginState == "authenticated"}
					Reply Notifications
					{#if replyNotificationsPending}
					...
					{:else}
						<span class="notification-preferences-state" role="button" tabindex="0" on:click={setReplyNotifications(!replyNotificationsEnabled)} on:keypress={setReplyNotifications(!replyNotificationsEnabled)}>
							{#if replyNotificationsEnabled}
								Enabled
							{:else}
								Disabled
							{/if}
						</span>
					{/if}
				{/if}
			</div>
			{#if loginState !== "pending" && loginState !== "awaitingApi"}
				<div class="confab-branding">
					<span role="presentation" on:click={() => window.open("https://confabcomments.com")} class="confab-branding-logo-corner"><ConfabLogo/></span>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	.confab-branding {
		color: var(--confab-branding-color);
		text-align: right;
		padding: 10px;
		user-select: none;
		font-size: 0.9em;
		
		display: flex;
		justify-content: flex-end;
	}

	.confab-branding-logo-corner {
		width: 70px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 5px;
		margin-bottom: 1px;
		cursor: pointer;
	}

	.user-login-container {
		background-color: var(--background-color);
		outline: 1px solid var(--outline-color-grey);
		border-radius: 4px;
	}

	.user-login {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 30px 20px;
	}

	.user-login-title {
		font-family: "Questrial", sans-serif;
		text-align: center;
		font-size: 2em;
	}

	.user-login-subtitle {
		margin-top: 7px;
		font-size: 0.5em;
		color: var(--comment-color-grey-dark);
	}

	.user-login-email-input-container {
		display: flex;
		align-items: center;
    	justify-content: center;
	}

	.user-login-email {
		padding: 30px 0 0 0;
	}

	.user-login-email-input {
		background-color: var(--background-color);
		text-align: center;
		border: none;
		height: 40px;
		font-size: 1.3em;
		border-radius: 5px;
		outline: var(--outline-color-grey-dark) 1px solid;
		color: var(--text-color);
		padding: 0 5px;

		transition: outline-color 0.2s;

		position: relative;
		z-index: 1;
		font-family: inherit;

		width: min(350px, 60vw);
	}

	.user-login-email-input::placeholder {
		color: #b9b9b9;
	}

	.user-login-email-invalid {
		outline-color: red;
	}

	.user-login-email-submit {
		display: inline-block;
		padding-left: 10px;

		position: relative;
		z-index: 0;

		transition-property: opacity, margin-left;
		transition-duration: 0.4s;
		transition-timing-function: cubic-bezier(0.42, 0, 0.17, 1);
	}

	.user-login-email-submit-btn-hidden {
		opacity: 0;
		margin-left: -50px;
	}

	.user-login-email-submit-btn {
		height: 40px;
		width: 40px;
		border: none;
		outline: rgba(0, 0, 0, 0.192) 1px solid;
		border-radius: 5px;
		font-size: 1.2em;
		color: aliceblue;
		background-color: var(--btn-color-main);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.user-login-email-submit-btn-disabled {
		cursor: unset;
		background-color: var(--btn-color-main-disabled);
	}

	.user-login-passwordless {
		opacity: 0.2;
		text-align: center;
		padding: 15px 0;
		user-select: none;
	}

	.user-login-code-options-top {
		padding: 5px 0;
	}

	.user-login-code-options-bottom {
		display: flex;
		justify-content: space-around;
		padding: 5px 0;
		text-align: center;
	}

	.user-login-code-options-btn {
		padding: 2px 5px;
		cursor: pointer;
		border-radius: 4px;
		display: inline-block;
		transition: background-color 0.2s;
		user-select: none;
	}

	.user-login-code-options-btn:hover {
		background-color: var(--comment-color-grey);
	}

	.user-login-code-options-btn-disabled {
		cursor: unset;
	}

	.user-login-code-options-btn-disabled:hover {
		background-color: unset;
	}

	.user-auth-panel-options-top {
		font-size: 0.8em;
		color: #b4b5b6;
		text-align: center;
	}

	.user-auth-panel-profile-pic {
		--profile-pic-size: 80px;
		height: var(--profile-pic-size);
		aspect-ratio: 1/1;
		background-color: color-mix(in srgb, var(--background-color), var(--comment-color-grey) 50%);
		margin: 20px 0;
		border-radius: 10px;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 2px 2px 10px var(--comment-color-grey-dark);
	}

	.user-auth-panel-profile-pic-img {
		height: calc(var(--profile-pic-size) - 0px);
		aspect-ratio: 1/1;
		filter: var(--profile-pic-filter);
	}

	.user-auth-panel-profile-pic-placeholder {
		font-size: 2em;
		color: #d8d8d8;
	}

	.user-auth-panel-profile-pic-hidden {
		height: 0;
	}

	.user-auth-panel-change-username-outer{
		text-align: center;
		display:flex;
		align-items: center;
	}

	.user-auth-panel-change-username {
		display: inline-block;
		margin-inline-start: 5px;
		padding: 0 4px 1px 4px;
		border-radius: 5px;

		transition: border-color 0.2s;
		min-width: 10px;
		height: 1.5em;
		text-align: center;
	}
	
	.user-auth-panel-change-username-enabled{
		border: #bebebe dotted 2px;
	}

	.user-auth-panel-change-username-error {
		border-color: #c72828;
	}

	.user-auth-panel-change-username-btn {
		margin-inline-start: 0px;
		color: var(--comment-color-grey-dark);
		aspect-ratio: 1;
		padding: 0px 5px;
		border-radius: 4px;
		cursor: pointer;
	}

	.user-auth-panel-change-username-btn:hover {
		background-color: var(--comment-color-grey);
		transition: background-color 0.2s;
	}

	.user-auth-panel-change-username-first-btn {
		margin-inline-start: 5px;
	}

	.user-auth-panel-change-username-feedback{
		margin-top: 4px;
		color: red;
		font-size: 0.8em;
	}

	.user-auth-panel-logout {
		text-decoration: underline;
		cursor: pointer;
	}
	.user-auth-panel-logout:hover {
		text-decoration: none;
	}
	@keyframes flash-auth-anim {
		0% {
			box-shadow: none;
		}
		5% {
			box-shadow: 0 0 10px 2px var(--btn-color-main);
		}
		95% {
			box-shadow: 0 0 10px 2px var(--btn-color-main);
		}
		100% {
			box-shadow: none;
		}
	}

	.flash-auth {
		animation-name: flash-auth-anim;
		animation-duration: 5s;
	}

	.user-login-email-error {
		text-align: center;
		color: red;
	}

	.user-login-unavailable-login-btn {
		color: var(--text-color);
		opacity: 0.3;
		text-align: right;
		width: 100%;
		font-size: 0.8em;
		user-select: none;
		cursor: pointer;
		transform: translateY(-15px);
	}

	.bottom-row{
		display: flex;
		
		justify-content: space-between;
		align-items: center;
	}

	.notification-preferences{
		padding: 10px;
		font-size: 0.8em;
		color: #b4b5b6;
		user-select: none;
	}

	.notification-preferences-state{
		cursor: pointer;
		text-decoration: underline;
	}
</style>
