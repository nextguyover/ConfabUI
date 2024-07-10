<script>
	import CommentTag from "./comment-tag.svelte";
	import { createLoadObserver } from "../misc/util.js";
	import { getContext, onMount } from "svelte";

	import CommentTextarea from "./comment-textarea.svelte";

	import Fa from "svelte-fa/src/fa.svelte";
	import { faChevronUp, faChevronDown, faCaretUp, faCaretDown, faReply, faPaperPlane, faXmark, faCircleNotch, faSpinner, faLink, faUser, faAnglesUp, faComments, faUserSlash, faTrashCan, faPencil, faTriangleExclamation, faTrashCanArrowUp, faUserPlus, faDumpsterFire, faFireFlameCurved, faCheck } from "@fortawesome/free-solid-svg-icons";

	export let comment;
	export let parent = null;
	export let parentCollapsed = null;
	export let rootActions;
	export let userData;
	export let parentRemoveReply = null;
	export let depth = null;
	export let maxStaggerDepth = null;
	export let isForDisplay = false;
	export let commentingEnabled = true;

    const PUBLIC_API_URL = getContext("PUBLIC_API_URL");

	import Tooltip from "../misc/tooltip.svelte";
	import Markdown from "../markdown/Markdown.svelte";

	let removingReply = false;
	let newReplyPending = false;
	let newReplyContent = "";

	let newReplyFailed = false;

	let flashComment = false;

	const UserRole = {
		Standard: 0,
		Admin: 1,
	};

	let profilePicLoaded = false;

	const onProfilePicLoad = createLoadObserver(() => {
		profilePicLoaded = true;
	});

	let containerRef;
	let newCommentContainerRef;
	let commentSizeRef;
	let childrenSizeRef;
	let commentCollapsed = false;

	let commentButtonTooltipLongHoverDelayMs = 1000;

	$: parentOrCommentCollapsed = parentCollapsed || commentCollapsed;

	$: childCommentCount = rootActions?.commentCountRecursive(comment);

	let deletedContentHidden = true;

	const toggleVote = async (isUpvote) => {
		if(isForDisplay || comment.isDeleted) return;

		if (!userData.email) {
			rootActions.scrollToAuthPanel();
			return;
		}

		const VoteType = {
			None: 0,
			Upvote: 1,
			Downvote: 2,
		};

		if (isUpvote) {
			if (comment.userVote == VoteType.None) {
				comment.userVote = VoteType.Upvote;
				comment.upvotes += 1;
			} else if (comment.userVote == VoteType.Upvote) {
				comment.userVote = VoteType.None;
				comment.upvotes -= 1;
			} else if (comment.userVote == VoteType.Downvote) {
				comment.userVote = VoteType.Upvote;
				comment.upvotes += 1;
				comment.downvotes -= 1;
			}
		} else {
			if (comment.userVote == VoteType.None) {
				comment.userVote = VoteType.Downvote;
				comment.downvotes += 1;
			} else if (comment.userVote == VoteType.Upvote) {
				comment.userVote = VoteType.Downvote;
				comment.downvotes += 1;
				comment.upvotes -= 1;
			} else if (comment.userVote == VoteType.Downvote) {
				comment.userVote = VoteType.None;
				comment.downvotes -= 1;
			}
		}

		const response = await fetch(PUBLIC_API_URL + "/comment/vote", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + localStorage.getItem("jwtToken"),
			},
			body: JSON.stringify({
				commentId: comment.commentId,
				voteType: comment.userVote,
			}),
		});
	};

	const addReply = () => {
		if (!userData.email) {
			rootActions.scrollToAuthPanel();
			return;
		}

		if(!comment.childComments.find((c) => c.newComment === true)){
			rootActions.registerNewOrEdit("new", comment.commentId);
			comment.childComments = [{newComment: true}, ...comment.childComments]; //using spread syntax here rather than array.push() necessary for svelte re-render
			setTimeout(() => rootActions.scrollIntoView("#" + comment.commentId + "-reply", true), rootActions.getNewCommentAnimDuration() + 50);
		}
		else {
			rootActions.scrollIntoView("#" + comment.commentId + "-reply");
		}
	};

	const removeReply = () => {
		comment.childComments = comment.childComments.toSpliced(comment.childComments.find((c) => c.newComment === true), 1);
		rootActions.deregisterNewOrEdit("new", comment.commentId);
	};

	
	let confirmRemoveComment = false;
	let confirmRemoveCommentTimeout;

	const callParentRemoveReply = () => {
		if(!confirmRemoveComment && newReplyContent !== ""){
			confirmRemoveComment = true;

			clearTimeout(confirmRemoveCommentTimeout);
			confirmRemoveCommentTimeout = setTimeout(() => {
				confirmRemoveComment = false;
			}, 3000);
			return;
		}
		
		confirmRemoveComment = false;

		flashComment = false;
		if (!removingReply && !newReplyPending) {
			calcNewCommentHeight();
			removingReply = true;
			setTimeout(() => {
				parentRemoveReply();
			}, 600);
		}
	};

	const sendReply = async () => {
		if (!removingReply && !newReplyPending) {
			flashComment = false;
			newReplyFailed = false;

			if (!validateCommentContent(newReplyContent)){
				newReplyPending = false;
				return false;
			}

			newReplyPending = true;
			let newReplyId = await submitReply(newReplyContent);
			if (newReplyId) {
				rootActions.deregisterNewOrEdit("new", parent === null ? "root" : parent.commentId);
				await rootActions.refreshComments();
				rootActions.scrollIntoView("#" + newReplyId);
			} else {
				newReplyFailed = true;
				setTimeout(() => newReplyFailed = false, 3000);
			}
			newReplyPending = false;
		}
	};

	let commentErrorMessage = null;
	$: resetCommentErrorMessage(newReplyContent)
	const resetCommentErrorMessage = (discard) => {
		commentErrorMessage = null;
	}

	let submitReply = async (content) => {
		let response, json;
		try {
			response = await fetch(PUBLIC_API_URL + "/comment/new", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + localStorage.getItem("jwtToken"),
				},
				body: JSON.stringify({
					location: rootActions.getCommentLocation(),
					content: content,
					parentCommentId: parent === null ? null : parent.commentId,
				}),
			});
			json = await response.json();
		} catch{} finally {
			if (response?.ok && json) {
				return json.commentId;
			}
			if(json?.feedback){
				commentErrorMessage = json.feedback;
			} else{
				commentErrorMessage = "Something went wrong. Please try again.";
			}
			
			return false;
		}
	}

	let linkCopySuccess = null;
	let linkCopySuccessTimeout;
	const getCommentLink = async () => {
		navigator.clipboard.writeText(window.location.host + window.location.pathname + "#" + comment.commentId)
		.then(() => {
			linkCopySuccess = true;
		})
		.catch(() => {
			linkCopySuccess = false
		}).finally(() => {
			clearTimeout(linkCopySuccessTimeout);
			linkCopySuccessTimeout = setTimeout(() => {
				linkCopySuccess = null;
			}, 2000)
		});
	};

	const goToParent = () => {
		flashComment = false;

		rootActions.scrollIntoView("#" + parent.commentId);
	};

	function flashElement() {
		if (flashComment !== true) {
			flashComment = true;
			setTimeout(() => {
				flashComment = false;
			}, 5000);
		}
	}

	let commentCollapseTimeout;

	const collapseCommentToggle = async (collapseState = !commentCollapsed) => {
        containerRef.style.setProperty(`--comment-max-height`, (childrenSizeRef.offsetHeight + commentSizeRef.offsetHeight  + 100) + "px");
		containerRef.style.setProperty(`--comment-collapse-overflow`, "hidden");

		await new Promise(r => setTimeout(r, 10));
		
		commentCollapsed = collapseState;

		let collapseAnimDuration = getComputedStyle(containerRef).getPropertyValue('--comment-collapse-anim-duration');
		collapseAnimDuration = collapseAnimDuration.substring(0, collapseAnimDuration.length - 1);

		if(!commentCollapsed){
			clearTimeout(commentCollapseTimeout);
			commentCollapseTimeout = setTimeout(() => {
				if(!commentCollapsed){
					containerRef.style.setProperty(`--comment-max-height`, "unset");
					containerRef.style.setProperty(`--comment-collapse-overflow`, "unset");
				}
			}, collapseAnimDuration * 1000);
		}
	}

	const startEdit = () => {
		rootActions.registerNewOrEdit("edit", comment.commentId);
		showPreview = false;
		comment.currentlyEditing = true;
		newReplyContent = newReplyContent ? newReplyContent : comment.content;
	};

	const sendEdit = async () => {
		if(!newReplyPending){
			flashComment = false;
			newReplyPending = true;
			newReplyFailed = false;
			
			if (!validateCommentContent(newReplyContent)){
				newReplyPending = false;
				return false;
			}

			let response, json;
			try {
				response = await fetch(PUBLIC_API_URL + "/comment/edit", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + localStorage.getItem("jwtToken"),
					},
					body: JSON.stringify({
						commentId: comment.commentId,
						newContent: newReplyContent,
					}),
				});
				json = await response.json();
			} catch{} finally {
				if (response?.ok) {
					rootActions.deregisterNewOrEdit("edit", comment.commentId);
					await rootActions.refreshComments();
					newReplyPending = false;
					return;
				}
				
				if(json?.feedback){
					commentErrorMessage = json.feedback;
				} else{
					commentErrorMessage = "Something went wrong. Please try again.";
				}

				newReplyFailed = true;
				setTimeout(() => newReplyFailed = false, 3000);
				newReplyPending = false;
			}
		}
	}

	const cancelEdit = () => {
		rootActions.deregisterNewOrEdit("edit", comment.commentId);
		comment.currentlyEditing = false;
	}

	const validateCommentContent = (content) => {
		if(content.length < 3) {
			commentErrorMessage = "Comment is too short. Must be at least 3 characters long.";
			return false;
		}
		if(content.length > 10000) {
			commentErrorMessage = "Comment is too long. Must be less than 10000 characters long.";
			return false;
		} 
		
		return true;
	}

	let confirmDeletion = false;
	let confirmDeletionTimeout;
	let deletionPending = false;
	let deletionError = false;

	const deleteComment = async () => {
		if(!deletionPending && !deletionError){
			if(!confirmDeletion){
				confirmDeletion = true;

				clearTimeout(confirmDeletionTimeout);
				confirmDeletionTimeout = setTimeout(() => {
					confirmDeletion = false;
				}, 3000);
				return;
			}

			confirmDeletion = false;
			deletionPending = true;

			let response;
			try {
				response = await fetch(PUBLIC_API_URL + "/comment/delete", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + localStorage.getItem("jwtToken"),
					},
					body: JSON.stringify({
						id: comment.commentId,
					}),
				});
			} catch{} finally {
				if (response?.ok) {
					await rootActions.refreshComments();
				} else {
					deletionError = true;
					setTimeout(() => {
						deletionError = false;
					}, 3000);
				}
				deletionPending = false;
			}
		}
	}

	onMount(() => {
		if(comment.isDeleted && userData.role !== UserRole.Admin && childCommentCount == 0){
			collapseCommentToggle(true);
		}
	})

	let undeletionPending = false;
	const undeleteComment = async () => {
		if(!undeletionPending){
			undeletionPending = true;

			let response;
			try {
				response = await fetch(PUBLIC_API_URL + "/comment/undelete", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + localStorage.getItem("jwtToken"),
					},
					body: JSON.stringify({
						id: comment.commentId,
					}),
				});
			} catch{} finally {
				if (response?.ok) {
					await rootActions.refreshComments();
				}
				undeletionPending = false;
			}
		}
	}

	let banPending = false;
	const banUser = async () => {
		if(!banPending){
			banPending = true;

			let response;
			try {
				response = await fetch(PUBLIC_API_URL + "/admin/ban-user", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + localStorage.getItem("jwtToken"),
					},
					body: JSON.stringify({
						id: comment.authorId,
					}),
				});
			} catch{} finally {
				if (response?.ok) {
					await rootActions.refreshComments();
				}
				banPending = false;
			}
		}
	}

	let unBanPending = false;
	const unBanUser = async () => {
		if(!banPending){
			unBanPending = true;

			let response;
			try {
				response = await fetch(PUBLIC_API_URL + "/admin/un-ban-user", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + localStorage.getItem("jwtToken"),
					},
					body: JSON.stringify({
						id: comment.authorId,
					}),
				});
			} catch{} finally {
				if (response?.ok) {
					await rootActions.refreshComments();
				}
				unBanPending = false;
			}
		}
	}

	let massDeletePending = false;
	let confirmMassDeletion = false;
	let confirmMassDeletionTimeout;

	const massDeleteComments = async () => {
		if(!massDeletePending){
			if(!confirmMassDeletion){
				confirmMassDeletion = true;

				clearTimeout(confirmMassDeletionTimeout);
				confirmMassDeletionTimeout = setTimeout(() => {
					confirmMassDeletion = false;
				}, 3000);
				return;
			}
			
			massDeletePending = true;
			confirmMassDeletion = false;

			let response;
			try {
				response = await fetch(PUBLIC_API_URL + "/comment/delete-all", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + localStorage.getItem("jwtToken"),
					},
					body: JSON.stringify({
						id: comment.authorId,
					}),
				});
			} catch{} finally {
				if (response?.ok) {
					await rootActions.refreshComments();
				}
				massDeletePending = false;
			}
		}
	}
	
	let modApprovePending = false;

	const modApprove = async () => {
		if(!modApprovePending){
			modApprovePending = true;

			let response;
			try {
				response = await fetch(PUBLIC_API_URL + "/admin/comment/moderation-accept", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + localStorage.getItem("jwtToken"),
					},
					body: JSON.stringify({
						id: comment.commentId,
					}),
				});
			} catch{} finally {
				if (response?.ok) {
					await rootActions.refreshComments();
				}
				modApprovePending = false;
			}
		}
	}


	let permaDeletePending = false;
	let confirmPermaDelete = false;
	let confirmPermaDeleteTimeout;

	const permaDeleteComment = async () => {
		if(!permaDeletePending){
			if(!confirmPermaDelete){
				confirmPermaDelete = true;

				clearTimeout(confirmPermaDeleteTimeout);
				confirmPermaDeleteTimeout = setTimeout(() => {
					confirmPermaDelete = false;
				}, 3000);
				return;
			}
			
			permaDeletePending = true;
			confirmPermaDelete = false;

			let response;
			try {
				response = await fetch(PUBLIC_API_URL + "/admin/comment/permanently-delete", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + localStorage.getItem("jwtToken"),
					},
					body: JSON.stringify({
						id: comment.commentId,
					}),
				});
			} catch{} finally {
				if (response?.ok) {
					await rootActions.refreshComments();
				}
				permaDeletePending = false;
			}
		}
	}
	
	let permaDeleteAllModQueuePending = false;
	let confirmPermaDeleteAllModQueue = false;
	let confirmPermaDeleteAllModQueueTimeout;

	const permaDeleteAllModQueue = async () => {
		if(!permaDeleteAllModQueuePending){
			if(!confirmPermaDeleteAllModQueue){
				confirmPermaDeleteAllModQueue = true;

				clearTimeout(confirmPermaDeleteAllModQueueTimeout);
				confirmPermaDeleteAllModQueueTimeout = setTimeout(() => {
					confirmPermaDeleteAllModQueue = false;
				}, 3000);
				return;
			}
			
			permaDeleteAllModQueuePending = true;
			confirmPermaDeleteAllModQueue = false;

			let response;
			try {
				response = await fetch(PUBLIC_API_URL + "/admin/comment/moderation-permanently-delete-all", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + localStorage.getItem("jwtToken"),
					},
					body: JSON.stringify({
						id: comment.authorId,
					}),
				});
			} catch{} finally {
				if (response?.ok) {
					await rootActions.refreshComments();
				}
				permaDeleteAllModQueuePending = false;
			}
		}
	}

	const calcNewCommentHeight = () => {
		newCommentContainerRef.style.setProperty(`--new-comment-height`, (containerRef.offsetHeight + 50) + "px");
	}

	let showPreview = false;

</script>

{#if comment.newComment}
	<div bind:this={newCommentContainerRef} class:new-comment-remove={removingReply} class="new-comment-container" id={parent ? parent.commentId + "-reply" : "root-reply"} on:flashElement={flashElement}>
		<div bind:this={containerRef} class="comment-container new-comment">
			<div class="comment" class:flash-comment={flashComment}>
				<div class="top-row">
					<div class="top-row-left">
						<div class="top-row-left-user-block">
							{#if depth > maxStaggerDepth + 1}
								<div class="comment-replying-to" role="button" tabindex="0" on:click={() => goToParent()} on:keypress={() => goToParent()}>
									<Fa icon={faReply} /> Replying to
									{parent.authorUsername}
									<img class="comment-replying-to-profile-pic" src={PUBLIC_API_URL + "/user/get-profile-picture/" + parent.authorId} alt="Replying to profile" />
								</div>
							{/if}
							<div class="user">
								<div class="user-icon">
									<img use:onProfilePicLoad class="user-icon-img" class:user-icon-image-hidden={!profilePicLoaded} src={PUBLIC_API_URL + "/user/get-profile-picture/" + userData.userId} alt="Profile" />
									{#if !profilePicLoaded}
										<div class="user-icon-placeholder"><Fa icon={faUser} /></div>
									{/if}
								</div>
								<div class="username">
									{userData.username ? userData.username : "Anonymous Comment"}
								</div>
								<div class="user-tags">
									<CommentTag tagType={"author"} />
									{#if userData.role == UserRole.Admin}
										<CommentTag tagType={"admin"} />
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="preview-btn" role="button" tabindex="0" on:click={() => showPreview = !showPreview} on:keypress={() => showPreview = !showPreview}>{showPreview ? "Hide" : "Show"} Preview</div>
				<div class="new-comment-content">
					{#if !showPreview}
						<CommentTextarea bind:newReplyContent {newReplyPending}/>
					{:else}
						<Markdown source={newReplyContent} />
					{/if}
					{#if commentErrorMessage}
						<div class="comment-error-message">
							{commentErrorMessage}
						</div>
					{/if}
				</div>
				<div class="button-row">
					<div class="button-row-inner">
						<!-- <Tooltip tooltip="Submit new comment" showAfterDelayMs={commentButtonTooltipLongHoverDelayMs}> -->
							<div role="button" tabindex="0" on:click={sendReply} on:keypress={sendReply} class="comment-btn-icon-container" class:comment-btn-icon-container-pending={newReplyPending} class:comment-btn-error={newReplyFailed}>
								<div class="comment-btn-icon">
									<div class="comment-btn-icon-inner">
										{#if newReplyPending}
											<Fa icon={faSpinner} spin />
										{:else}
											<Fa icon={faPaperPlane} />
										{/if}
									</div>
								</div>
							</div>
						<!-- </Tooltip> -->
						<!-- <Tooltip tooltip="Cancel new comment" showAfterDelayMs={commentButtonTooltipLongHoverDelayMs}> -->
							<div role="button" tabindex="0" on:click={callParentRemoveReply} on:keypress={callParentRemoveReply} class="comment-btn-icon-container" class:comment-btn-icon-container-pending={newReplyPending} class:comment-btn-error={confirmRemoveComment} on:mouseleave={() => confirmRemoveComment = false} on:focusout={() => confirmRemoveComment = false} >
								<div class="comment-btn-icon">
									<div class="comment-btn-icon-inner" class:delete-confirm={confirmRemoveComment}>
										{#if !confirmRemoveComment}
											<Fa icon={faXmark} />
										{:else}
											<Fa icon={faXmark} size="1.2x" />
										{/if}
									</div>
								</div>
							</div>
						<!-- </Tooltip> -->
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div bind:this={containerRef} class="comment-container" id={comment.commentId} on:flashElement={flashElement} class:comment-collapsed={commentCollapsed} role="presentation" on:click={() => {if(commentCollapsed) collapseCommentToggle(false)}}>
		<div bind:this={commentSizeRef} class="comment" class:flash-comment={flashComment} class:comment-awaiting-mod-approval={userData.role === UserRole.Admin && comment.awaitingModeration} class:comment-awaiting-mod-approval-user={userData.role !== UserRole.Admin && comment.awaitingModeration && !comment.currentlyEditing && !isForDisplay}>
			<div class="top-row" class:top-row-collapsed={commentCollapsed}>
				<div class="top-row-left">
					{#if !isForDisplay}
						<div class="top-row-left-collapse-btn" role="button" tabindex={parentCollapsed ? -1 : 0} on:click={() => collapseCommentToggle()} on:keypress={() => collapseCommentToggle()} aria-label="Comment collapse toggle">
							<div class="top-row-left-collapse-btn-icon" class:top-row-left-collapse-btn-icon-flip={commentCollapsed}>
								<Fa icon={faAnglesUp} />
							</div>
						</div>
					{/if}
					<div class="top-row-left-user-block">
						{#if depth > maxStaggerDepth && !commentCollapsed}
							<div class="comment-replying-to" role="button" tabindex={parentOrCommentCollapsed ? -1 : 0}  on:click={goToParent} on:keypress={goToParent}>
								<Fa icon={faReply} /> Replying to
								{#if !parent.isDeleted || userData.role === UserRole.Admin}
									{parent.authorUsername}
									<img class="comment-replying-to-profile-pic" src={PUBLIC_API_URL + "/user/get-profile-picture/" + parent.authorId} alt="Replying to profile" />
								{:else}
									<span class="replying-to-deleted">
										[Deleted]
									</span>
								{/if}
							</div>
						{/if}
						<div class="user">
							<div class="user-icon" class:user-icon-collapsed={commentCollapsed}>
								{#if !(comment.isDeleted && userData.role !== UserRole.Admin)}
									<img use:onProfilePicLoad class="user-icon-img" class:user-icon-image-hidden={!profilePicLoaded} src={PUBLIC_API_URL + "/user/get-profile-picture/" + comment.authorId} alt="Profile" />
									{#if !profilePicLoaded}
										<div class="user-icon-placeholder"><Fa icon={faUser} /></div>
									{/if}
								{:else}
									<div class="user-icon-placeholder"><Fa icon={faUser} /></div>
								{/if}
							</div>
							<div class="username" class:username-collapsed={commentCollapsed} class:username-deleted={comment.isDeleted}>
								{#if userData.role == UserRole.Admin}
									<span class="user-banned">{comment.isBanned ? "[Banned] " : ""}</span>{comment.isDeleted ? "[Deleted] " : ""} {comment.authorUsername} 
								{:else}
									{comment.isDeleted ? "[Deleted]" : comment.authorUsername}
								{/if}
								{comment.awaitingModeration ? "[Awaiting Moderation]" : ""}
							</div>
							<div class="user-tags" class:user-tags-collapsed={commentCollapsed}>
								{#if comment.isAuthor}
									<CommentTag tagType={"author"} />
								{/if}
								{#if comment.isAdmin}
									<CommentTag tagType={"admin"} />
								{/if}
							</div>
							{#if commentCollapsed && childCommentCount > 0}
								<div class="collapsed-child-count">
									<Fa icon={faComments}/> {childCommentCount}
								</div>
							{/if}
						</div>
					</div>
				</div>
				{#if !comment.isDeleted || (comment.isDeleted && userData.role === UserRole.Admin)}
					<div>
						<div class="timestamp" class:timestamp-collapsed={commentCollapsed}>
							{rootActions.formatTimeAgo(Date.parse(comment.creationTime))}
							{#if comment.commentEdited && !commentCollapsed}
								{#if !isForDisplay}
									<div class="timestamp-edit" 
									class:timestamp-edit-clickable={comment.editHistoryAvailable} 
									role="button" 
									tabindex={parentOrCommentCollapsed ? -1 : 0} 
									on:click={() => comment.editHistoryAvailable ? rootActions.viewEditHistory(comment) : null} 
									on:keypress={() => comment.editHistoryAvailable ? rootActions.viewEditHistory(comment) : null} >
										<Fa icon={faPencil} /> {comment.editTime ? rootActions.formatTimeAgo(Date.parse(comment.editTime)) : ""}
									</div>
								{:else}
									<div class="timestamp-edit">
										<Fa icon={faPencil} /> {comment.editTime ? rootActions.formatTimeAgo(Date.parse(comment.editTime)) : ""}
									</div>
								{/if}
							{/if}
						</div>
					</div>
				{/if}
			</div>

			{#if comment.currentlyEditing}
				<div class="preview-btn" role="button" tabindex="0" on:click={() => showPreview = !showPreview} on:keypress={() => showPreview = !showPreview}>{showPreview ? "Hide" : "Show"} Preview</div>
			{/if}
	
			{#if !comment.currentlyEditing || isForDisplay}
				<div class="comment-content" class:content-deleted={comment.isDeleted && userData.role !== UserRole.Admin}>
					{#if comment.isDeleted && userData.role !== UserRole.Admin}
						This comment has been deleted
					{:else}
						{#if comment.isDeleted}
							<div class="content-deleted-show-content" role="button" tabindex={parentOrCommentCollapsed ? -1 : 0}  on:click={() => deletedContentHidden = !deletedContentHidden} on:keypress={() => deletedContentHidden = !deletedContentHidden} >
							{#if deletedContentHidden}
								[Show deleted content]
							{:else}
								[Hide deleted content]
							{/if}
							</div>
							{#if !deletedContentHidden}
								<Markdown source={comment.content} confirmImageUrl />
							{/if}
						{:else}
							<Markdown source={comment.content} confirmImageUrl={comment.awaitingModeration && userData.userId !== comment.authorId}/>
						{/if}
					{/if}
				</div>
				<div class="button-row">
					<div class="button-row-inner">
						{#if (!comment.isDeleted || userData.role === UserRole.Admin || isForDisplay) && comment.awaitingModeration !== true}
							<!-- <Tooltip tooltip="Upvote comment" showAfterDelayMs={commentButtonTooltipLongHoverDelayMs}> -->
							<div role="button" tabindex={parentOrCommentCollapsed ? -1 : 0} on:click={() => toggleVote(true)} on:keypress={() => toggleVote(true)} class="comment-btn-icon-container">
									<div class="comment-btn-icon {comment.userVote == 1 ? 'upvote-btn-active' : ''}">
										<div class="upvote-btn comment-btn-icon-inner">
											<Fa icon={faChevronUp} />
										</div>
										{comment.upvotes ? comment.upvotes : (comment.upvotes = 0, 0)}
									</div>
								</div>
							<!-- </Tooltip> -->
							<!-- <Tooltip tooltip="Downvote comment" showAfterDelayMs={commentButtonTooltipLongHoverDelayMs}> -->
								<div role="button" tabindex={parentOrCommentCollapsed ? -1 : 0} on:click={() => toggleVote(false)} on:keypress={() => toggleVote(false)} class="comment-btn-icon-container">
									<div class="comment-btn-icon {comment.userVote == 2 ? 'downvote-btn-active' : ''}">
										<div class="downvote-btn comment-btn-icon-inner {comment.userHasDownvoted ? 'downvote-btn-active' : ''}">
											<Fa icon={faChevronDown} />
										</div>
										{comment.downvotes ? comment.downvotes : (comment.downvotes = 0, 0)}
									</div>
								</div>
							<!-- </Tooltip> -->
						{/if}
						{#if !isForDisplay}
							{#if (!comment.isDeleted || userData.role === UserRole.Admin) && (!comment.awaitingModeration || (comment.awaitingModeration && userData.role === UserRole.Admin)) && commentingEnabled}
								<!-- <Tooltip tooltip="Reply to comment" showAfterDelayMs={commentButtonTooltipLongHoverDelayMs}> -->
									<div role="button" tabindex={parentOrCommentCollapsed ? -1 : 0} on:click={addReply} on:keypress={addReply} class="comment-btn-icon-container">
										<div class="comment-btn-icon">
											<div class="comment-btn-icon-inner">
												<Fa icon={faReply} />
											</div>
										</div>
									</div>
								<!-- </Tooltip> -->
							{/if}

							{#if userData.userId == comment.authorId && !comment.isDeleted && comment.canEdit}
								<!-- <Tooltip tooltip="Edit comment" showAfterDelayMs={commentButtonTooltipLongHoverDelayMs}> -->
									<div role="button" tabindex={parentOrCommentCollapsed ? -1 : 0} on:click={startEdit} on:keypress={startEdit} class="comment-btn-icon-container">
										<div class="comment-btn-icon">
											<div class="comment-btn-icon-inner">
												<Fa icon={faPencil} />
											</div>
										</div>
									</div>
								<!-- </Tooltip> -->
							{/if}

							{#if (userData.userId == comment.authorId || userData.role == UserRole.Admin) && !comment.isDeleted && !comment.awaitingModeration}
								<!-- <Tooltip tooltip="Delete comment" showAfterDelayMs={commentButtonTooltipLongHoverDelayMs}> -->
									<div role="button" tabindex={parentOrCommentCollapsed ? -1 : 0} on:click={deleteComment} on:keypress={deleteComment} on:mouseleave={() => confirmDeletion = false} on:focusout={() => confirmDeletion = false} class="comment-btn-icon-container" class:comment-btn-error={confirmDeletion} >
										<div class="comment-btn-icon">
											<div class="comment-btn-icon-inner" class:delete-confirm={confirmDeletion}>
												{#if deletionPending}
													<Fa icon={faSpinner} spin/>
												{:else}
													{#if deletionError}
														<Fa icon={faTriangleExclamation} />
													{:else if confirmDeletion}
														<Fa icon={faTrashCan} size="1.2x" />
													{:else}
														<Fa icon={faTrashCan} />
													{/if}
												{/if}
											</div>
										</div>
									</div>
								<!-- </Tooltip> -->
							{/if}

							{#if comment.isDeleted && userData.role === UserRole.Admin}
								<Tooltip tooltip="Undelete comment">
									<div role="button" tabindex={parentOrCommentCollapsed ? -1 : 0} on:click={undeleteComment} on:keypress={undeleteComment} class="comment-btn-icon-container" >
										<div class="comment-btn-icon">
											<div class="comment-btn-icon-inner">
												{#if undeletionPending}
													<Fa icon={faSpinner} spin/>
												{:else}
													<Fa icon={faTrashCanArrowUp} />
												{/if}
											</div>
										</div>
									</div>
								</Tooltip>
							{/if}

							
							{#if comment.isDeleted && userData.role === UserRole.Admin}
								<Tooltip tooltip="Permanently Delete Comment and Children">
										<div role="button" tabindex={parentOrCommentCollapsed ? -1 : 0} on:click={permaDeleteComment} on:keypress={permaDeleteComment} on:mouseleave={() => confirmPermaDelete = false} on:focusout={() => confirmPermaDelete = false} class="comment-btn-icon-container" class:comment-btn-error={confirmPermaDelete}>
											<div class="comment-btn-icon">
												<div class="comment-btn-icon-inner" class:delete-confirm={confirmPermaDelete}>
													{#if permaDeletePending}
														<Fa icon={faSpinner} spin/>
													{:else}
														{#if confirmPermaDelete}
															<Fa icon={faTrashCan} size="1.2x" />
														{:else}
															<Fa icon={faTrashCan} />
														{/if}
													{/if}
												</div>
											</div>
										</div>
								</Tooltip>
							{/if}
							
							{#if userData.role == UserRole.Admin && comment.awaitingModeration}
								<Tooltip tooltip="Approve">
									<div role="button" tabindex={parentOrCommentCollapsed ? -1 : 0} on:click={modApprove} on:keypress={modApprove} class="comment-btn-icon-container">
										<div class="comment-btn-icon">
											<div class="comment-btn-icon-inner">
												{#if modApprovePending}
													<Fa icon={faSpinner} spin/>
												{:else}
													<Fa icon={faCheck} />
												{/if}
											</div>
										</div>
									</div>
								</Tooltip>
								<Tooltip tooltip="Permanently Delete">
									<div role="button" tabindex={parentOrCommentCollapsed ? -1 : 0} on:click={permaDeleteComment} on:keypress={permaDeleteComment} on:mouseleave={() => confirmPermaDelete = false} on:focusout={() => confirmPermaDelete = false} class="comment-btn-icon-container" class:comment-btn-error={confirmPermaDelete}>
										<div class="comment-btn-icon">
											<div class="comment-btn-icon-inner" class:delete-confirm={confirmPermaDelete}>
												{#if permaDeletePending}
													<Fa icon={faSpinner} spin/>
												{:else}
													{#if confirmPermaDelete}
														<Fa icon={faTrashCan} size="1.2x" />
													{:else}
														<Fa icon={faTrashCan} />
													{/if}
												{/if}
											</div>
										</div>
									</div>
								</Tooltip>
								<Tooltip tooltip="Permanently Delete User's All Pending Comments">
									<div role="button" tabindex={parentOrCommentCollapsed ? -1 : 0} on:click={permaDeleteAllModQueue} on:keypress={permaDeleteAllModQueue} on:mouseleave={() => confirmPermaDeleteAllModQueue = false} on:focusout={() => confirmPermaDeleteAllModQueue = false} class="comment-btn-icon-container" class:comment-btn-error={confirmPermaDeleteAllModQueue}>
										<div class="comment-btn-icon">
											<div class="comment-btn-icon-inner" class:delete-confirm={confirmPermaDeleteAllModQueue}>
												{#if permaDeleteAllModQueuePending}
													<Fa icon={faSpinner} spin/>
												{:else}
													{#if confirmPermaDeleteAllModQueue}
														<Fa icon={faFireFlameCurved} size="1.2x" />
													{:else}
														<Fa icon={faFireFlameCurved} />
													{/if}
												{/if}
											</div>
										</div>
									</div>
								</Tooltip>
							{/if}

							{#if userData.role == UserRole.Admin && userData.userId != comment.authorId && !comment.isBanned}
								<Tooltip tooltip="Ban User">		
									<div role="button" tabindex={parentOrCommentCollapsed ? -1 : 0} on:click={banUser} on:keypress={banUser} class="comment-btn-icon-container">
										<div class="comment-btn-icon">
											<div class="comment-btn-icon-inner">
												{#if banPending}
													<Fa icon={faSpinner} spin/>
												{:else}
													<Fa icon={faUserSlash} />
												{/if}
											</div>
										</div>
									</div>
								</Tooltip>
							{/if}

							{#if userData.role == UserRole.Admin && comment.isBanned}
								<Tooltip tooltip="Unban User">
									<div role="button" tabindex={parentOrCommentCollapsed ? -1 : 0} on:click={unBanUser} on:keypress={unBanUser} class="comment-btn-icon-container">
										<div class="comment-btn-icon">
											<div class="comment-btn-icon-inner">
												{#if unBanPending}
													<Fa icon={faSpinner} spin/>
												{:else}
													<Fa icon={faUserPlus} />
												{/if}
											</div>
										</div>
									</div>
								</Tooltip>
							{/if}

							{#if userData.role == UserRole.Admin && comment.isBanned}
								<Tooltip tooltip="Delete All User's Comments">
									<div role="button" tabindex={parentOrCommentCollapsed ? -1 : 0} on:click={massDeleteComments} on:keypress={massDeleteComments} on:mouseleave={() => confirmMassDeletion = false} on:focusout={() => confirmMassDeletion = false} class="comment-btn-icon-container" class:comment-btn-error={confirmMassDeletion}>
										<div class="comment-btn-icon">
											<div class="comment-btn-icon-inner" class:delete-confirm={confirmMassDeletion}>
												{#if massDeletePending}
													<Fa icon={faSpinner} spin/>
												{:else}
													{#if confirmMassDeletion}
														<Fa icon={faDumpsterFire} size="1.2x" />
													{:else}
														<Fa icon={faDumpsterFire} />
													{/if}
												{/if}
											</div>
										</div>
									</div>
								</Tooltip>
							{/if}
						{/if}
					</div>
					<div class="button-row-inner">
						{#if !comment.isDeleted || userData.role === UserRole.Admin}
							<Tooltip tooltip={linkCopySuccess !== null ? (linkCopySuccess === true ? "Link copied!" : "Error copying link") : null} forceShowTooltip={linkCopySuccess !== null} >
								<div role="button" tabindex={parentOrCommentCollapsed ? -1 : 0} on:click={() => getCommentLink()} on:keypress={() => getCommentLink()} class="comment-btn-icon-container" >
									<div class="comment-btn-icon">
										<div class="comment-btn-icon-inner">
											<Fa icon={faLink} size="0.9x" />
										</div>
									</div>
								</div>
							</Tooltip>
						{/if}
					</div>
				
				</div>
			{:else}			
				<div class="new-comment-content">
					{#if !showPreview}
						<CommentTextarea bind:newReplyContent {newReplyPending}/>
					{:else}
						<Markdown source={newReplyContent} />
					{/if}
					{#if commentErrorMessage}
						<div class="comment-error-message">
							{commentErrorMessage}
						</div>
					{/if}
					<div class="edit-comment-tooltip">
						Edit history may be publicly visible. To remove sensitive information, please delete this comment.
					</div>
				</div>
				<div class="button-row">
					<div class="button-row-inner">
						<!-- <Tooltip tooltip="Submit edit" showAfterDelayMs={commentButtonTooltipLongHoverDelayMs}> -->
							<div role="button" tabindex="0" on:click={sendEdit} on:keypress={sendEdit} class="comment-btn-icon-container" class:comment-btn-icon-container-pending={newReplyPending} class:comment-btn-error={newReplyFailed}>
								<div class="comment-btn-icon">
									<div class="comment-btn-icon-inner">
										{#if newReplyPending}
											<Fa icon={faSpinner} spin />
										{:else}
											<Fa icon={faPaperPlane} />
										{/if}
									</div>
								</div>
							</div>
						<!-- </Tooltip> -->
						<!-- <Tooltip tooltip="Cancel edit" showAfterDelayMs={commentButtonTooltipLongHoverDelayMs}> -->
							<div role="button" tabindex="0" on:click={cancelEdit} on:keypress={cancelEdit} class="comment-btn-icon-container" class:comment-btn-icon-container-pending={newReplyPending}>
								<div class="comment-btn-icon">
									<div class="comment-btn-icon">
										<div class="comment-btn-icon-inner">
											<Fa icon={faXmark} />
										</div>
									</div>
								</div>
							</div>
						<!-- </Tooltip> -->
					</div>
				</div>
			{/if}
		</div>
		{#if !isForDisplay}
			<div bind:this={childrenSizeRef} class="child-comments" class:child-comments-non-staggered={depth > maxStaggerDepth}>
				{#each comment.childComments as childComment (childComment.commentId)}
					<svelte:self comment={childComment} parent={comment} parentRemoveReply={removeReply} {rootActions} {userData} {commentingEnabled} depth={depth + 1} {maxStaggerDepth} parentCollapsed={parentOrCommentCollapsed} />
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.comment-container {
		--comment-border-radius: 5px;
		--comment-collapse-anim-duration: 0.2s;
		--comment-collapse-overflow: unset;

		max-height: var(--comment-max-height);
		transition: max-height var(--comment-collapse-anim-duration) ease;
		margin: 10px 0;
		margin-bottom: 0;
		overflow: var(--comment-collapse-overflow);
	}
	
	.comment-collapsed {
		max-height: 40px;
		border-radius: var(--comment-border-radius);
		cursor: pointer;
	}

	.comment {
		padding: 10px;
		background-color: var(--background-color);
		border-radius: var(--comment-border-radius);
		overflow: hidden;
	}
	.comment-awaiting-mod-approval {
		--stripe-dark: color-mix(in srgb,var(--background-color), color-mix(in srgb, var(--comment-color-grey), rgb(17, 33, 121) 30%) 25%);
		--stripe-light: var(--background-color);
		background: linear-gradient(135deg, var(--stripe-light) 25%, var(--stripe-dark) 25%, var(--stripe-dark) 50%, var(--stripe-light) 50%, var(--stripe-light) 75%, var(--stripe-dark) 75%, var(--stripe-dark));
  		background-size: 15px 15px;
	}

	.child-comments {
		margin-left: 7px;
		border-left: 1px solid var(--outline-color-grey-dark);
		padding-left: 10px;
	}

	.comment-content {
		padding: 10px 10px;
		word-wrap: break-word;
		margin-top: -16px;
		margin-bottom: -16px;
	}

	.content-deleted {
		font-style: italic;
		margin: 0;
	}

	.content-deleted-show-content{
		font-style: italic;
		user-select: none;
		cursor: pointer;
		margin: 10px 0;
	}

	.top-row {
		display: flex;
		justify-content: space-between;
	}

	.top-row-left {
		display:flex;
	}

	.top-row-left-user-block {
		padding-left: 5px;
		display:flex;
		flex-direction: column;

	}

	.top-row-left-collapse-btn {
		position:relative;
		margin-left: -10px;
		background-color: var(--comment-color-grey);
		height: 1em;
		border-radius: 0 4px 4px 0;
		padding: 2px;
		color: var(--comment-color-grey-dark);
		cursor: pointer;
		user-select: none;
	}

	.top-row-left-collapse-btn-icon {
		transition: transform var(--comment-collapse-anim-duration) ease;
		display: flex;
	}

	.top-row-left-collapse-btn-icon-flip {
		transform: rotate(180deg);
	}

	.user {
		display: flex;
		align-items: center;
		padding-bottom: 10px;
	}
	.user-icon {
		--profile-pic-size: 40px;
		height: var(--profile-pic-size);
		aspect-ratio: 1/1;
		background-color: color-mix(in srgb, var(--background-color), var(--comment-color-grey) 50%);
		border-radius: 3px;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
	}

	.user-icon-collapsed {
		--profile-pic-size: 30px;
		margin-top: -5px;
		margin-bottom: 15px;
	}

	.user-icon-img {
		height: calc(var(--profile-pic-size) - 0px);
		aspect-ratio: 1/1;
		filter: var(--profile-pic-filter);
	}
	.user-icon-placeholder {
		color: #d8d8d8;
	}
	.user-icon-image-hidden {
		height: 0;
	}
	.username {
		padding-left: 10px;
		padding-right: 10px;
		font-weight: 500;
	}

	.timestamp {
		text-align: right;
		user-select: none;
	}
	.timestamp-edit {
		margin-top: 3px;
		font-size: 0.8em;
		color: var(--comment-color-grey-dark);
		user-select: none;
	}

	.timestamp-edit-clickable {
		cursor: pointer;
		text-decoration: underline;
	}

	.timestamp-edit-clickable:hover {
		text-decoration: none;
	}

	.username-collapsed {
		margin-top: -20px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-tags-collapsed {
		margin-top: -20px;
		margin-right: 10px;
	}

	.collapsed-child-count {
		margin-top: -20px;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-right: 10px;
		color: var(--comment-color-grey-dark);
	}

	.timestamp-collapsed{
		margin-top: -2px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.preview-btn{
		font-size: 0.8em;
		color: var(--comment-color-grey-dark);
		text-decoration: underline;
		margin-left: 10px;
		cursor: pointer;
		user-select: none;
	}
	.preview-btn:hover{
		text-decoration: none;
	}
	.button-row {
		display: flex;
		justify-content: space-between;
		color: var(--comment-color-grey-dark);
		user-select: none;
	}

	.button-row-inner {
		display: flex;
        flex-wrap: wrap;
	}

	.comment-btn-icon-container {
		margin: 0 5px;
		padding: 5px 10px;
		cursor: pointer;
		width: 30px;
		border-radius: 4px;
		transition-property: background-color, color;
		transition-duration: 0.2s;
	}
	.comment-btn-icon-container:hover {
		background-color: var(--comment-color-grey);
	}

	.comment-btn-icon-container-pending {
		color: #d8d8d8;
		cursor: initial;
	}

	.comment-btn-icon-container-pending:hover {
		background-color: initial;
	}

	.comment-btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 1.5em;

		transition-property: color;
		transition-duration: 0.2s;
	}

	.comment-btn-icon-inner {
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.comment-btn-error {
		background-color: var(--comment-color-red);
	}

	.comment-btn-error:hover {
		background-color: color-mix(in srgb,var(--comment-color-red),#000 10%);
	}

	.upvote-btn {
		padding-right: 5px;
	}

	.downvote-btn {
		padding-right: 5px;
	}

	.upvote-btn-active {
		color: #ff0000;
	}

	.downvote-btn-active {
		color: #6726e0;
	}

	.new-comment-container {
		--new-comment-height: 300px;
	}

	@keyframes animateNewComment {
		0% {
			overflow: hidden;
			max-height: 0px;
		}
		100% {
			overflow: hidden;
			max-height: var(--new-comment-height);
		}
	}
	@keyframes animateRemoveNewComment {
		0% {
			max-height: var(--new-comment-height);
		}
		100% {
			max-height: 0px;
		}
	}

	.new-comment-container {
		animation: 1s cubic-bezier(0.35, -0.01, 0, 0.99) 0s animateNewComment;
	}

	.new-comment-remove {
		overflow: hidden;
		animation: 0.6s cubic-bezier(0.35, -0.01, 0, 0.99) 0s animateRemoveNewComment;
		max-height: 0px;
	}

	.new-comment {
		margin-top: 0px;
		margin-bottom: 0px;
		padding-top: 10px;
	}

	.new-comment-content {
		padding: 10px;
	}

	.comment-replying-to {
		max-width: fit-content;
		margin: 0px 0 10px 0;
		font-size: 0.8em;
		color: var(--comment-color-grey-dark);
		cursor: pointer;
	}

	.comment-replying-to:hover {
		text-decoration: underline;
	}

	.comment-replying-to-profile-pic {
		height: 2em;
		margin-bottom: -8px;
		border-radius: 2px;
	}

	@keyframes flash-comment-anim {
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

	.flash-comment {
		animation-name: flash-comment-anim;
		animation-duration: 5s;
	}


	@keyframes shake {
		0%, 100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-2px);
		}
		50% {
			transform: translateX(2px);
		}
		75% {
			transform: translateX(-2px);
		}
	}

	.delete-confirm{
		animation: shake 0.3s infinite;
		color: rgb(114, 114, 114);
	}

	.username-deleted {
		font-style: italic;
		font-weight: 400;
	}

	.replying-to-deleted {
		font-style: italic;
	}

	.edit-comment-tooltip {
		margin: 10px 0 0 0;
		font-size: 0.8em;
		color: var(--comment-color-grey-dark);
	}

	.comment-error-message{
		margin: 10px 0 0 0;
		font-size: 0.8em;
		color: red;
	}

	.user-banned {
		color: #ff0000;
	}

	@media (max-width: 500px) {
		.timestamp {
			/* display: none; */
			overflow: hidden;
			text-align: left;
			padding-left: 10px;
			color: var(--comment-color-grey-dark);
			font-size: 0.8em;
			margin-bottom: 10px;
		}
		.timestamp::before {
			content: "Posted "
		}
		.timestamp-edit {
			display: inline-block;
			font-size: 0.9em;
		}
		.top-row {
			flex-direction:column;
		}
	}

	@media (max-width: 500px) {
		.comment {
			padding: 5px;
		}
		
		.button-row {
			font-size: 0.95em;
		}

		.comment-btn-icon-container {
			padding: 1px 3px;
		}

		.top-row-left {
			font-size: 0.9em;
		}

		.user-icon {
			--profile-pic-size: 30px;
		}

		.comment-content {
			font-size: 0.94em;
		}

		.top-row-left-collapse-btn{
			margin-top: 4px;
			margin-left: -6px;
		}

		.comment-collapsed {
			max-height: 36px;
		}

		.user-icon-collapsed {
			--profile-pic-size: 28px;
			margin-top: -1px;
			margin-bottom: 7px;
		}

		.username-collapsed {
			margin-top: -7px;
		}

		.user-tags-collapsed {
			margin-top: -7px;
		}

		.collapsed-child-count {
			margin-top: -7px;
		}
	}

	@media (min-width: 600px) {
		.child-comments {
			margin-left: 10px;
			padding-left: 5px;
			padding-left: 12px;
		}
	}
	
	.child-comments-non-staggered {
		padding: 0;
		margin: 0;
		border: 0;
	}

</style>
