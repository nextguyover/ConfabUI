<script>
	export let PUBLIC_API_URL;
	export let shadowRoot = null;
	export let dispatchEventLightDom = null;
	export let darkMode;

	setContext('PUBLIC_API_URL', PUBLIC_API_URL);
	import { onMount, setContext } from "svelte";

	import Comment from "$lib/components/comment/comment.svelte";
	import UserLogin from "$lib/components/user-auth.svelte";
	import Dropdown from "$lib/components/misc/dropdown.svelte";
	import CommentHistoryModal from "$lib/components/modals/comment-history-modal.svelte";
	import Tooltip from "$lib/components/misc/tooltip.svelte";

	let userData = {
		email: null,
		userId: null,
		username: null,
		role: null,
	};
	const UserRole = {
		Standard: 0,
		Admin: 1,
	};

	let commentLocation = null;

	let comments;
	let commentingEnabled = true;
	let commentingDisabledReason = null;
	let commentCount;

	let authPanel;
	let isAuthenticated;

	let newCommentAnimDuration = 600;

	let refreshCommentCount = () => {
		if (!comments) return;

		let count = 0;
		comments.forEach((comment) => {
			if (!comment.newComment) {
				count += rootActions.commentCountRecursive(comment);
				count += 1;
			}
		});
		return count;
	};

	$: commentCount = refreshCommentCount(comments);

	let commentSortTypes = [
		{ value: 0, label: `Most Upvotes` },
		{ value: 1, label: `Most Downvotes` },
		{ value: 2, label: `Newest` },
		{ value: 3, label: `Oldest` },
	];

	let commentSortTypeSelected = 0;

	let commentHistoryItem;
	let commentHistoryModalEnabled = false;

	let currentReplyList = [];
	let currentEditList = [];

	let restoreRepliesAndEditsInProgress = (comments) => {
		comments.forEach((comment) => {
			if (currentReplyList.includes(comment.commentId)) {
				comment.childComments = [{newComment: true}, ...comment.childComments];
			}
			if (currentEditList.includes(comment.commentId)) {
				comment.currentlyEditing = true;
			}

			if (comment.childComments) {
				restoreRepliesAndEditsInProgress(comment.childComments);
			}
		});
	};

	let rootActions = {
		getApi: () => {
			return PUBLIC_API_URL;
		},
		refreshComments: async () => {
			let response, json;
			try {
				response = await fetch(PUBLIC_API_URL + "/comment/get-at-location", {
						method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + localStorage.getItem("jwtToken"),
					},
						body: JSON.stringify({ location: commentLocation, sort: commentSortTypeSelected }),
					});
				json = await response.json();
			} catch{} finally {
				if (response?.ok && json) {
					comments = json;
					if(currentReplyList.includes("root")){	//restore root lvl reply if it was in progress before refresh
						comments = [{newComment: true}, ...comments];
					}
					restoreRepliesAndEditsInProgress(comments);
				}
				else{
					comments = false;
				}
			}

			if(userData.email){
				try {
					response = await fetch(PUBLIC_API_URL + "/comment/commenting-enabled-at-location", {
							method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: "Bearer " + localStorage.getItem("jwtToken"),
						},
							body: JSON.stringify({ location: commentLocation }),
						});
					json = await response.json();
				} catch{} finally {
					if (response?.ok && json) {
						commentingEnabled = json.enabled;
						commentingDisabledReason = json.reason;
					}
					else{
						commentingEnabled = true;
					}
				}
			}
		},
		registerNewOrEdit: (type, parentId) => {
			if(type == "new"){
				currentReplyList.push(parentId);
			} else if(type == "edit"){
				currentEditList.push(parentId);
			}
		},
		deregisterNewOrEdit: (type, parentId) => {
			if(type == "new"){
				currentReplyList = currentReplyList.filter((id) => id !== parentId);
			} else if(type == "edit"){
				currentEditList = currentEditList.filter((id) => id !== parentId);
			}
		},
		printCommentTree: () => {
			console.log(comments);
		},
		initUserData: (newUserData) => {
			if (newUserData === null) {
				userData = {
					email: null,
					userId: null,
					username: null,
					role: null,
				};
			} else {
				userData = newUserData;
			}

			rootActions.refreshComments();
		},
		scrollToAuthPanel: () => {
			rootActions.scrollIntoView("#confab-auth");
		},
		scrollIntoView: (target, noFlash = false) => {
			var element;
			if(shadowRoot){
				element = shadowRoot.querySelector(target);
			}
			else {
				element = document.querySelector(target);
			}
			
			if (!element) return;

			const elementRect = element.getBoundingClientRect();
			const absoluteElementTop = elementRect.top + window.scrollY;
			const middle = absoluteElementTop - window.innerHeight / 2;
			const offsetFromCenter = 200;

			window.scrollTo({
				top: middle + offsetFromCenter,
				behavior: "smooth",
			});

			if(!noFlash){
				if(dispatchEventLightDom){
					dispatchEventLightDom(element, new CustomEvent("flashElement"))
				}
				else {
					element.dispatchEvent(new CustomEvent("flashElement"));
				}
			}
		},
		scrollToUrlHash: () => {
			if (window.location.hash) {
				var hashData = window.location.hash.substring(1);

				if (hashData === "confab-auth") {
					rootActions.scrollToAuthPanel();
				} else if (hashData.substring(0, 2) === "c_") {
					rootActions.scrollIntoView("#" + hashData);
				}
			}
		},
		commentCountRecursive: (comments) => {
			let count = 0;

			if (comments.childComments) {
				comments.childComments.forEach((comment) => {
					if(!comment.newComment){
						count += rootActions.commentCountRecursive(comment);
						count += 1;
					}
				});
			}

			return count;
		},
		viewEditHistory: (comment) => {
			commentHistoryItem = comment;
			commentHistoryModalEnabled = true;
		},
		formatTimeAgo: (date) => {
			const now = new Date();
			let timeDifference = now - date;
			if(timeDifference < 0) timeDifference = 0;

			const seconds = Math.floor(timeDifference / 1000);
			const minutes = Math.floor(seconds / 60);
			const hours = Math.floor(minutes / 60);
			const days = Math.floor(hours / 24);
			const weeks = Math.floor(days / 7);
			const months = Math.floor(days / 30);
			const years = Math.floor(days / 365);

			if (years >= 1) {
				return `${years} year${years > 1 ? "s" : ""} ago`;
			} else if (months >= 1) {
				return `${months} month${months > 1 ? "s" : ""} ago`;
			} else if (weeks >= 1) {
				return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
			} else if (days >= 1) {
				return `${days} day${days > 1 ? "s" : ""} ago`;
			} else if (hours >= 1) {
				return `${hours} hour${hours > 1 ? "s" : ""} ago`;
			} else if (minutes >= 1) {
				return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
			} else {
				return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
			}
		}, 
		getCommentLocation: () => {
			return commentLocation;
		},
		getNewCommentAnimDuration: () => {
			return newCommentAnimDuration;
		}
	};

	onMount(async () => {
		commentLocation = window.location.href;
		await rootActions.refreshComments();
		rootActions.scrollToUrlHash();
	});

	let commentContainer;
	let maxStaggerDepth = 5;

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries.at(0);
			// let appWidth = entry.contentBoxSize[0].blockSize;
			let appWidth = entry.contentRect.width;

			if (appWidth > 600) {
				maxStaggerDepth = 6;
			} else if (appWidth > 500) {
				maxStaggerDepth = 5;
			} else if (appWidth > 400) {
				maxStaggerDepth = 4;
			} else if (appWidth > 300) {
				maxStaggerDepth = 2;
			}
		});
		resizeObserver.observe(commentContainer);
		return () => resizeObserver.unobserve(commentContainer);
	});

	const addTopLevelComment = () => {
		if (!userData.email) {
			rootActions.scrollToAuthPanel();
			return;
		}

		if(!comments.find((c) => c.newComment === true)){
			rootActions.registerNewOrEdit("new", "root");
			comments = [{newComment: true}, ...comments]; //using spread syntax here rather than array.push() necessary for svelte re-render
			setTimeout(() => rootActions.scrollIntoView("#root-reply", true), rootActions.getNewCommentAnimDuration() + 50);
		}
		else {
			rootActions.scrollIntoView("#root-reply");
		}
	};

	const removeNewTopLevelReply = () => {
		rootActions.deregisterNewOrEdit("new", "root");
		comments = comments.toSpliced(comments.find((c) => c.newComment === true), 1);
	};
</script>

<main class:main-dark={darkMode}>
	<CommentHistoryModal bind:enabled={commentHistoryModalEnabled} comment={commentHistoryItem} {rootActions} {userData}/>

	<UserLogin bind:this={authPanel} {rootActions} {userData} apiAvailable={comments === undefined ? "pending" : !(comments === false)} bind:isAuthenticated={isAuthenticated}/>

	{#if isAuthenticated && userData.role === UserRole.Admin}
		{#await import("$lib/components/admin/moderation-queue-panel.svelte")}		<!--https://www.okupter.com/blog/svelte-await-block -->
			<p style="margin: 20px 0;">Loading Moderation Queue Panel...</p>
		{:then ModQueuePanel}
			<br/>
			<ModQueuePanel.default {rootActions}/>
		{:catch error}
			There was an error loading the moderation queue panel!
			<p style="color: red">{error.message}</p>
		{/await}
	{/if}

	{#if isAuthenticated && userData.role === UserRole.Admin}
		{#await import("$lib/components/admin/admin-panel.svelte")}
			<p style="margin: 20px 0;">Loading Admin Panel...</p>
		{:then AdminPanel}
			<br/>
			<AdminPanel.default/>
		{:catch error}
			There was an error loading the admin panel!
			<p style="color: red">{error.message}</p>
		{/await}
	{/if}

	<section>
		{#if comments}
			<div class="comment-title-row">
				<span class="comment-title-row-comment-count">{commentCount} Comment{commentCount === 1 ? "" : "s"}</span>
				<span class="comment-sort"
					>Sort By
					<div class="dropdown-container">
						<Dropdown items={commentSortTypes} bind:value={commentSortTypeSelected} onChange={rootActions.refreshComments}/>
					</div>
				</span>
			</div>
			<div class="add-new-comment">
				{#if commentingEnabled}
					<button class="add-new-comment-btn" on:click={addTopLevelComment}>Add a New Comment</button>
				{:else}
					<Tooltip tooltip={commentingDisabledReason ?? "Can't comment right now, try again later"} >
						<button class="add-new-comment-btn add-new-comment-btn-disabled" disabled={true}>Add a New Comment</button>
					</Tooltip>
				{/if}
			</div>
		{/if}
	</section>
	<section bind:this={commentContainer}>
		{#if comments}
			{#each comments as comment (comment.commentId)}
				<Comment {comment} {rootActions} {userData} {commentingEnabled} depth={1} {maxStaggerDepth} parent={null} parentRemoveReply={removeNewTopLevelReply} parentCollapsed={false} />
			{/each}
		{/if}
	</section>
</main>

<style>
	@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800&display=swap");
	@import url("https://fonts.googleapis.com/css2?family=Questrial&display=swap");
	@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap');

	main {
		font-family: "Poppins", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;

		--btn-color-main: #434ff5;
		--btn-color-main-disabled: #6c70a2;
		--background-color: #f9f9f9;
		--background-color-modal: #ffffff;
		--text-color: #000000;
		--comment-color-red: #ffa9a9;
		--comment-color-grey: #e6e6e6;
		--comment-color-grey-mid: #c9c9c9;
		--comment-color-grey-dark: #969696;
		--comment-color-grey-darker: #5a5a5a;
		--confab-branding-color:  #cdcdcd;
		--outline-color-grey: #d8d8d8;
		--outline-color-grey-dark: #cacaca;

		--color-success-green: rgb(13, 172, 13);
		--color-warning-orange: rgb(226, 118, 17);
		--color-error-red: rgb(175, 28, 28);
		--color-special-blue: rgb(28, 67, 175);

		--dropdown-background: #f7f8fa;
		--dropdown-highlight: #dbeaff;
		--dropdown-select: #cfe2ff;

		--upvote-orange: #ff0000;
		--downvote-blue: #6726e0;

		--textarea-background: #fefefe;

		--md-link-color: #0830b6;
		--md-link-visited-color: #671099;
	}
	
	.main-dark {
		--btn-color-main: #3139af;
		--btn-color-main-disabled: #2f3147;
		--background-color: #1a1a1a;
		--background-color-modal: #131313;
		--text-color: #e9e9e9;
		--comment-color-red: #4b1b1b;
		--comment-color-grey: #2b2b2b;
		--comment-color-grey-mid: #3d3d3d;
		--comment-color-grey-dark: #979797;
		--comment-color-grey-darker: #d6d6d6;
		--confab-branding-color:  #494949;
		--outline-color-grey: #3a3a3a;
		--outline-color-grey-dark: #585858;

		--color-success-green: rgb(11, 136, 11);
		--color-warning-orange: rgb(192, 93, 1);
		--color-error-red: rgb(177, 1, 1);
		--color-special-blue: rgb(8, 49, 161);
		
		--dropdown-background: #2b2b2b;
		--dropdown-highlight: #2e3d53;
		--dropdown-select: #2e4c7a;
		
		--upvote-orange: #af0d0d;
		--downvote-blue: #4901cf;

		--textarea-background: #1f1f1f;
		
		--md-link-color: #5c82fe;
		--md-link-visited-color: #c36cf5;

		--profile-pic-filter: brightness(0.9);
	}

	main {
		color: var(--text-color);
	}

	.comment-title-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 20px;
	}

	.comment-title-row-comment-count {
		font-size: 1.2em;
		padding-right: 20px;
	}

	.add-new-comment {
		margin: 50px 0;
		display: flex;
		justify-content: center;
	}

	.add-new-comment-btn {
		padding: 10px;
		font: inherit;
		cursor: pointer;
		border: none;
		border-radius: 4px;
		background-color: var(--btn-color-main);
		color: white;
	}

	.add-new-comment-btn-disabled{
		background-color: var(--btn-color-main-disabled);
		cursor:unset;
	}

	.comment-sort {
		display: flex;
		align-items: center;
	}

	.dropdown-container {
		width: 180px;
		margin-left: 10px;
	}
	
	@media(max-width: 500px){
		.comment-title-row {
			flex-direction: column;
			align-items: normal;
		}
		.comment-sort {
			padding-top: 10px;
		}
	}
</style>
