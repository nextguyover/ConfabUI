<script>
    import Fa from "svelte-fa/src/fa.svelte";
	import { faArrowCircleDown, faArrowCircleUp, faArrowDown, faArrowRight, faChevronUp, faCircleCheck, faCircleExclamation, faCircleNotch, faCircleUp, faCircleXmark, faExclamationCircle, faEyeSlash, faFloppyDisk, faLock, faPlusCircle, faRightToBracket, faSpinner, faTrash } from "@fortawesome/free-solid-svg-icons";
    
	import Tooltip from "../misc/tooltip.svelte";
	import Dropdown from "../misc/dropdown.svelte";
    import AdminPanelOptionSelector from "./admin-panel-option-selector.svelte";
	import { getContext } from "svelte";

    export let currentLocation = window.location.href;

    const PUBLIC_API_URL = getContext("PUBLIC_API_URL");

    let panelCollapsed = true;

    let adminData = {
        globalCommenting: "loading",    //enabled, locked, hidden
        globalVoting: "loading",    //enabled, disabled
        globalAccLogin: "loading",    //enabled, disabled
        globalAccCreation: "loading",    //enabled, disabled

        localCommenting: "loading",     //uninitialised, enabled, locked, hidden
        localVoting: "loading",     //enabled, disabled
        localEditing: "loading",     //enabled, disabled

        adminNotifGlobal: "loading",     //enabled, disabled
        adminNotifEditGlobal: "loading",     //enabled, disabled
        adminNotifLocal: "loading",     //enabled, disabled
        adminNotifEditLocal: "loading",     //enabled, disabled
        userNotifGlobal: "loading",     //enabled, disabled
        userNotifLocal: "loading",     //enabled, disabled
    }

    let globalSignOutAllState = "ready";
    let globalSignOutAllTimeout;

	let statistics = null

    let globalCommentingPending = true;
    let globalVotingPending = true;
    let globalAccLoginPending = true;
    let globalAccCreationPending = true;
	
    let localCommentingPending = true;
    let localVotingPending = true;
    let localEditingPending = true;

    let adminNotifGlobalPending = true;
    let adminNotifEditGlobalPending = true;
    let adminNotifLocalPending = true;
    let adminNotifEditLocalPending = true;
    let userNotifGlobalPending = true;
    let userNotifLocalPending = true;

    let globalSignOutAllPending = false;
    
    $: refreshAdminDataOnPanelCollapse(panelCollapsed);

	const refreshAdminDataOnPanelCollapse = (panelCollapsed) => {
		if(!panelCollapsed){
			globalCommentingPending = true;
			globalVotingPending = true;
			globalAccCreationPending = true;
			globalAccLoginPending = true;

			localCommentingPending = true;
			localVotingPending = true;
			localEditingPending = true;

            adminNotifGlobalPending = true;
            adminNotifLocalPending = true;
            userNotifGlobalPending = true;
            userNotifLocalPending = true;

			refreshAdminData();

			statistics = null;
			refreshStatistics();
		}
	} 

    const refreshAdminData = async (disablePending = true) => {
        let response, json;
        try{
            response = await fetch(PUBLIC_API_URL + "/admin/settings/get-global", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                },
            })

            json = await response.json();
        } catch{} finally{
            if(response?.ok && json){
                switch(json.commentingStatus){
                    case 0: adminData.globalCommenting = "enabled"; break;
                    case 1: adminData.globalCommenting = "locked"; break;
                    case 2: adminData.globalCommenting = "hidden"; break;
                }
                adminData.globalVoting = json.votingEnabled ? "enabled" : "disabled";
                adminData.globalAccCreation = json.accountCreationEnabled ? "enabled" : "disabled";
                adminData.globalAccLogin = json.accountLoginEnabled ? "enabled" : "disabled";
            }

            if(disablePending){
                globalCommentingPending = false;
                globalVotingPending = false;
                globalAccCreationPending = false;
                globalAccLoginPending = false;
            }
        }
        
        try{
            response = await fetch(PUBLIC_API_URL + "/admin/settings/get-local", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                },
                body: JSON.stringify({
                    location: currentLocation,
                }),
            })

            json = await response.json();
        } catch{} finally{
            if(response?.ok && json){
                switch(json.commentingStatus){
                    case 0: adminData.localCommenting = "enabled"; break;
                    case 1: adminData.localCommenting = "locked"; break;
                    case 2: adminData.localCommenting = "hidden"; break;
                    case 3: adminData.localCommenting = "uninitialised"; break;
                }

                adminData.localVoting = json.votingStatus ? "enabled" : "disabled";
                adminData.localEditing = json.editingStatus ? "enabled" : "disabled";
            }

            if(disablePending){
    			localCommentingPending = false;
    			localVotingPending = false;
    			localEditingPending = false;
            }
        }

        try{
            response = await fetch(PUBLIC_API_URL + "/admin/settings/get-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                },
                body: JSON.stringify({
                    location: currentLocation,
                }),
            })

            json = await response.json();
        } catch{} finally{
            if(response?.ok && json){
                adminData.adminNotifGlobal = json.adminNotifGlobal ? "enabled" : "disabled";
                adminData.adminNotifEditGlobal = json.adminNotifEditGlobal ? "enabled" : "disabled";
                adminData.adminNotifLocal = json.adminNotifLocal ? "enabled" : "disabled";
                adminData.adminNotifEditLocal = json.adminNotifEditLocal ? "enabled" : "disabled";
                adminData.userNotifGlobal = json.userNotifGlobal ? "enabled" : "disabled";
                adminData.userNotifLocal = json.userNotifLocal ? "enabled" : "disabled";
            }

            if(disablePending){
                adminNotifGlobalPending = false;
                adminNotifEditGlobalPending = false;
                adminNotifLocalPending = false;
                adminNotifEditLocalPending = false;
                userNotifGlobalPending = false;
                userNotifLocalPending = false;
            }
        }
    };

	const refreshStatistics = async () => {
        let response, json;
        try{
            response = await fetch(PUBLIC_API_URL + "/admin/statistics", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                },
            })
            json = await response.json();
        } catch{} finally{
			statistics = json;
        }
	}

	const formatNumberWithSuffix = (number) => {
		const suffixes = ["", "K", "M", "B", "T"];
		const suffixIndex = Math.floor((String(number).length - 1) / 3);
		const actualSuffixIndex = Math.min(suffixIndex, suffixes.length - 1);
		const scaledNumber = number / Math.pow(1000, actualSuffixIndex);
		const includeDecimal = actualSuffixIndex > 0;
		const formattedNumber = includeDecimal
			? scaledNumber.toFixed(1) + suffixes[actualSuffixIndex]
			: Math.floor(scaledNumber) + suffixes[actualSuffixIndex];

		return formattedNumber;
	}

    const optionSelectorPanelColors = {
        success: "var(--color-success-green)",
        warning: "var(--color-warning-orange)",
        error: "var(--color-error-red)",
        specialBlue: "var(--color-special-blue)",
    }

    $: refreshCommentingPanelData(adminData.globalCommenting, globalCommentingPending);
    let commentingPanelData;
    const refreshCommentingPanelData = (state, pending) => {
        commentingPanelData = {
            title: "Commenting",
            currentlyLoading: pending,
            options: [
                {
                    centralIcon: faCircleCheck,
                    centralIconColor: optionSelectorPanelColors.success,
                    optionText: "Enabled",
                    btnIcon: faCircleCheck,
                    btnPressAction: () => {setGlobalCommenting("enabled")},
                    btnSelected: state === "enabled",
                },
                {
                    centralIcon: faCircleExclamation,
                    centralIconColor: optionSelectorPanelColors.warning,
                    optionText: "Locked",
                    btnIcon: faLock,
                    btnPressAction: () => {setGlobalCommenting("locked")},
                    btnSelected: state === "locked",
                },
                {
                    centralIcon: faCircleXmark,
                    centralIconColor: optionSelectorPanelColors.error,
                    optionText: "Hidden",
                    btnIcon: faEyeSlash,
                    btnPressAction: () => {setGlobalCommenting("hidden")},
                    btnSelected: state === "hidden",
                }
            ]
        }
    };

    const setGlobalCommenting = async (newValue) => {
        if(!globalCommentingPending && adminData.globalCommenting !== newValue){
            globalCommentingPending = true;
            
            try{
                await fetch(PUBLIC_API_URL + "/admin/settings/set-global", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                    body: JSON.stringify({
                        commentingStatus: newValue === "enabled" ? 0 : newValue === "locked" ? 1 : newValue === "hidden" ? 2 : null,
                    }),
                })
            } catch{} finally{
                await refreshAdminData(false);
                globalCommentingPending = false;
            }
        }
    }

    $: refreshVotePanelData(adminData.globalVoting, globalVotingPending);
    let votePanelData;
    const refreshVotePanelData = (state, pending) => {
        votePanelData = {
            title: "Voting",
            currentlyLoading: pending,
            options: [
                {
                    centralIcon: faCircleCheck,
                    centralIconColor: optionSelectorPanelColors.success,
                    optionText: "Enabled",
                    btnIcon: faCircleCheck,
                    btnPressAction: () => {setGlobalVoting("enabled")},
                    btnSelected: state === "enabled",
                },
                {
                    centralIcon: faCircleXmark,
                    centralIconColor: optionSelectorPanelColors.error,
                    optionText: "Disabled",
                    btnIcon: faCircleXmark,
                    btnPressAction: () => {setGlobalVoting("disabled")},
                    btnSelected: state === "disabled",
                }
            ]
        }
    };

    const setGlobalVoting = async (newValue) => {
        if(!globalVotingPending && adminData.globalVoting !== newValue){
            globalVotingPending = true;
            
            try{
                await fetch(PUBLIC_API_URL + "/admin/settings/set-global", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                    body: JSON.stringify({
                        votingEnabled: newValue === "enabled" ? true : false,
                    }),
                })
            } catch{} finally{
                await refreshAdminData(false);
                globalVotingPending = false;
            }
        }
    }

    
    $: refreshAccCreationPanelData(adminData.globalAccCreation, globalAccCreationPending);
    let accCreationPanelData;
    const refreshAccCreationPanelData = (state, pending) => {
        accCreationPanelData = {
            title: "Account Creation",
            currentlyLoading: pending,
            options: [
                {
                    centralIcon: faCircleCheck,
                    centralIconColor: optionSelectorPanelColors.success,
                    optionText: "Enabled",
                    btnIcon: faCircleCheck,
                    btnPressAction: () => {setGlobalAccCreation("enabled")},
                    btnSelected: state === "enabled",
                },
                {
                    centralIcon: faCircleXmark,
                    centralIconColor: optionSelectorPanelColors.error,
                    optionText: "Disabled",
                    btnIcon: faCircleXmark,
                    btnPressAction: () => {setGlobalAccCreation("disabled")},
                    btnSelected: state === "disabled",
                }
            ]
        }
    };

    const setGlobalAccCreation = async (newValue) => {
        if(!globalAccCreationPending && adminData.globalAccCreation !== newValue){
            globalAccCreationPending = true;
            
            try{
                await fetch(PUBLIC_API_URL + "/admin/settings/set-global", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                    body: JSON.stringify({
                        accountCreationEnabled: newValue === "enabled" ? true : false
                    }),
                })
            } catch{} finally{
                await refreshAdminData(false);
                globalAccCreationPending = false;
            }
        }
    }

    $: refreshAccLoginPanelData(adminData.globalAccLogin, globalAccLoginPending);
    let accLoginPanelData;
    const refreshAccLoginPanelData = (state, pending) => {
        accLoginPanelData = {
            title: "User Login",
            currentlyLoading: pending,
            options: [
                {
                    centralIcon: faCircleCheck,
                    centralIconColor: optionSelectorPanelColors.success,
                    optionText: "Enabled",
                    btnIcon: faCircleCheck,
                    btnPressAction: () => {setGlobalAccLogin("enabled")},
                    btnSelected: state === "enabled",
                },
                {
                    centralIcon: faCircleXmark,
                    centralIconColor: optionSelectorPanelColors.error,
                    optionText: "Disabled",
                    btnIcon: faCircleXmark,
                    btnPressAction: () => {setGlobalAccLogin("disabled")},
                    btnSelected: state === "disabled",
                }
            ]
        }
    };

    const setGlobalAccLogin = async (newValue) => {
        if(!globalAccLoginPending && adminData.globalAccLogin !== newValue){
            globalAccLoginPending = true;
            
            try{
                await fetch(PUBLIC_API_URL + "/admin/settings/set-global", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                    body: JSON.stringify({
                        accountLoginEnabled: newValue === "enabled" ? true : false
                    }),
                })
            } catch{} finally{
                await refreshAdminData(false);
                globalAccLoginPending = false;
            }
        }
    }

    $: refreshSignOutAllPanelData(globalSignOutAllState, globalSignOutAllPending);
    let signOutAllPanelData;
    const refreshSignOutAllPanelData = (state, pending) => {
        signOutAllPanelData = {
            title: "Sign Out All Users",
            currentlyLoading: pending,
            options: [
                {
                    centralIcon: faCircleExclamation,
                    centralIconColor: optionSelectorPanelColors.specialBlue ,
                    optionText: "Ready",
                    btnIcon: null,
                    btnPressAction: null,
                    btnSelected: state === "ready",
                },
                {
                    centralIcon: faCircleCheck,
                    centralIconColor: optionSelectorPanelColors.success,
                    optionText: "Success",
                    btnIcon: null,
                    btnPressAction: null,
                    btnSelected: state === "success",
                },
                {
                    centralIcon: faCircleXmark,
                    centralIconColor: optionSelectorPanelColors.error,
                    optionText: "Failed",
                    btnIcon: null,
                    btnPressAction: null,
                    btnSelected: state === "error",
                },
                {
                    centralIcon: null,
                    centralIconColor: null,
                    optionText: "",
                    btnIcon: faRightToBracket,
                    btnPressAction: () => {signOutAllUsers()},
                    btnSelected: false,
                }
            ]
        }
    };

    const signOutAllUsers = async () => {
        if(!globalSignOutAllPending){
            globalSignOutAllPending = true;
            clearTimeout(globalSignOutAllTimeout);
            
            let response;
            try{
                response = await fetch(PUBLIC_API_URL + "/admin/settings/sign-out-all-users", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                })
            } catch{} finally{
                if (response?.ok) {
                    globalSignOutAllState = "success";
                }
                else{
                    globalSignOutAllState = "error";
                }
                globalSignOutAllPending = false;

                globalSignOutAllTimeout = setTimeout(() => {
                    globalSignOutAllState = "ready";
                }, 3000)
            }
        }
    }

    $: refreshLocalCommentingPanelData(adminData.localCommenting, localCommentingPending);
    let localCommentingPanelData;
    const refreshLocalCommentingPanelData = (state, pending) => {
        if(state === "uninitialised"){
            localCommentingPanelData = {
                title: "Commenting",
                currentlyLoading: pending,
                options: [
                    {
                        centralIcon: faCircleUp,
                        centralIconColor: optionSelectorPanelColors.specialBlue,
                        optionText: "Uninitialised",
                        btnIcon: null,
                        btnPressAction: null,
                        btnSelected: state === "uninitialised",
                    },
                    {
                        centralIcon: null,
                        centralIconColor: optionSelectorPanelColors.success,
                        optionText: "",
                        btnIcon: faCircleCheck,
                        btnPressAction: () => {setLocalCommenting("enabled")},
                        btnSelected: state === "enabled",
                    }
                ]
            }
        }
        else{
            localCommentingPanelData = {
                title: "Commenting",
                currentlyLoading: pending,
                options: [
                    {
                        centralIcon: faCircleCheck,
                        centralIconColor: optionSelectorPanelColors.success,
                        optionText: "Enabled",
                        btnIcon: faCircleCheck,
                        btnPressAction: () => {setLocalCommenting("enabled")},
                        btnSelected: state === "enabled",
                    },
                    {
                        centralIcon: faCircleExclamation,
                        centralIconColor: optionSelectorPanelColors.warning,
                        optionText: "Locked",
                        btnIcon: faLock,
                        btnPressAction: () => {setLocalCommenting("locked")},
                        btnSelected: state === "locked",
                    },
                    {
                        centralIcon: faCircleXmark,
                        centralIconColor: optionSelectorPanelColors.error,
                        optionText: "Hidden",
                        btnIcon: faEyeSlash,
                        btnPressAction: () => {setLocalCommenting("hidden")},
                        btnSelected: state === "hidden",
                    }
                ]
            }
        }
    };

    const setLocalCommenting = async (newValue) => {
        if(!localCommentingPending && adminData.localCommenting !== newValue){
            localCommentingPending = true;
            
            try{
                await fetch(PUBLIC_API_URL + "/admin/settings/set-local", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                    body: JSON.stringify({
                        location: currentLocation,
                        commentingStatus: newValue === "enabled" ? 0 : newValue === "locked" ? 1 : newValue === "hidden" ? 2 : null,
                    }),
                })
            } catch{} finally{
                await refreshAdminData(false);
                localCommentingPending = false;
            }
        }
    }

    $: refreshLocalVotingPanelData(adminData.localVoting, localVotingPending);
    let localVotingPanelData;
    const refreshLocalVotingPanelData = (state, pending) => {
        localVotingPanelData = {
            title: "Voting",
            currentlyLoading: pending,
            options: [
                {
                    centralIcon: faCircleCheck,
                    centralIconColor: optionSelectorPanelColors.success,
                    optionText: "Enabled",
                    btnIcon: faCircleCheck,
                    btnPressAction: () => {setLocalVoting("enabled")},
                    btnSelected: state === "enabled",
                },
                {
                    centralIcon: faCircleXmark,
                    centralIconColor: optionSelectorPanelColors.error,
                    optionText: "Disabled",
                    btnIcon: faCircleXmark,
                    btnPressAction: () => {setLocalVoting("disabled")},
                    btnSelected: state === "disabled",
                }
            ]
        }
    };

    const setLocalVoting = async (newValue) => {
        if(!localVotingPending && adminData.localVoting !== newValue){
            localVotingPending = true;
            
            try{
                await fetch(PUBLIC_API_URL + "/admin/settings/set-local", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                    body: JSON.stringify({
                        location: currentLocation,
                        votingStatus: newValue === "enabled",
                    }),
                })
            } catch{} finally{
                await refreshAdminData(false);
                localVotingPending = false;
            }
        }
    }

    $: refreshLocalEditingPanelData(adminData.localEditing, localEditingPending);
    let localEditingPanelData;
    const refreshLocalEditingPanelData = (state, pending) => {
        localEditingPanelData = {
            title: "Editing",
            currentlyLoading: pending,
            options: [
                {
                    centralIcon: faCircleCheck,
                    centralIconColor: optionSelectorPanelColors.success,
                    optionText: "Enabled",
                    btnIcon: faCircleCheck,
                    btnPressAction: () => {setLocalEditing("enabled")},
                    btnSelected: state === "enabled",
                },
                {
                    centralIcon: faCircleXmark,
                    centralIconColor: optionSelectorPanelColors.error,
                    optionText: "Disabled",
                    btnIcon: faCircleXmark,
                    btnPressAction: () => {setLocalEditing("disabled")},
                    btnSelected: state === "disabled",
                }
            ]
        }
    };

    const setLocalEditing = async (newValue) => {
        if(!localEditingPending && adminData.localEditing !== newValue){
            localEditingPending = true;
            
            try{
                await fetch(PUBLIC_API_URL + "/admin/settings/set-local", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                    body: JSON.stringify({
                        location: currentLocation,
                        editingStatus: newValue === "enabled",
                    }),
                })
            } catch{} finally{
                await refreshAdminData(false);
                localEditingPending = false;
            }
        }
    }

    $: refreshAdminNotifGlobalPanelData(adminData.adminNotifGlobal, adminNotifGlobalPending);
    let adminNotifGlobalPanelData;
    const refreshAdminNotifGlobalPanelData = (state, pending) => {
        adminNotifGlobalPanelData = {
            title: "Admin (New Comments)",
            currentlyLoading: pending,
            options: [
                {
                    centralIcon: faCircleCheck,
                    centralIconColor: optionSelectorPanelColors.success,
                    optionText: "Enabled",
                    btnIcon: faCircleCheck,
                    btnPressAction: () => {setAdminNotifGlobal("enabled")},
                    btnSelected: state === "enabled",
                },
                {
                    centralIcon: faCircleXmark,
                    centralIconColor: optionSelectorPanelColors.error,
                    optionText: "Disabled",
                    btnIcon: faCircleXmark,
                    btnPressAction: () => {setAdminNotifGlobal("disabled")},
                    btnSelected: state === "disabled",
                }
            ]
        }
    };
    const setAdminNotifGlobal = async (newValue) => {
        if(!adminNotifGlobalPending && adminData.adminNotifGlobal !== newValue){
            adminNotifGlobalPending = true;
            
            try{
                await fetch(PUBLIC_API_URL + "/admin/settings/set-email", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                    body: JSON.stringify({
                        adminNotifGlobal: newValue === "enabled",
                        location: currentLocation,
                    }),
                })
            } catch{} finally{
                await refreshAdminData(false);
                adminNotifGlobalPending = false;
            }
        }
    }

    $: refreshAdminNotifEditGlobalPanelData(adminData.adminNotifEditGlobal, adminNotifEditGlobalPending);
    let adminNotifEditGlobalPanelData;
    const refreshAdminNotifEditGlobalPanelData = (state, pending) => {
        adminNotifEditGlobalPanelData = {
            title: "Admin (Edits)",
            currentlyLoading: pending,
            options: [
                {
                    centralIcon: faCircleCheck,
                    centralIconColor: optionSelectorPanelColors.success,
                    optionText: "Enabled",
                    btnIcon: faCircleCheck,
                    btnPressAction: () => {setAdminNotifEditGlobal("enabled")},
                    btnSelected: state === "enabled",
                },
                {
                    centralIcon: faCircleXmark,
                    centralIconColor: optionSelectorPanelColors.error,
                    optionText: "Disabled",
                    btnIcon: faCircleXmark,
                    btnPressAction: () => {setAdminNotifEditGlobal("disabled")},
                    btnSelected: state === "disabled",
                }
            ]
        }
    };
    const setAdminNotifEditGlobal = async (newValue) => {
        if(!adminNotifEditGlobalPending && adminData.adminNotifEditGlobal !== newValue){
            adminNotifEditGlobalPending = true;

            try{
                await fetch(PUBLIC_API_URL + "/admin/settings/set-email", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                    body: JSON.stringify({
                        adminNotifEditGlobal: newValue === "enabled",
                        location: currentLocation,
                    }),
                })
            } catch{} finally{
                await refreshAdminData(false);
                adminNotifEditGlobalPending = false;
            }
        }
    }

    $: refreshAdminNotifLocalPanelData(adminData.adminNotifLocal, adminNotifLocalPending);
    let adminNotifLocalPanelData;
    const refreshAdminNotifLocalPanelData = (state, pending) => {
        adminNotifLocalPanelData = {
            title: "Admin (New Comments)",
            currentlyLoading: pending,
            options: [
                {
                    centralIcon: faCircleCheck,
                    centralIconColor: optionSelectorPanelColors.success,
                    optionText: "Enabled",
                    btnIcon: faCircleCheck,
                    btnPressAction: () => {setAdminNotifLocal("enabled")},
                    btnSelected: state === "enabled",
                },
                {
                    centralIcon: faCircleXmark,
                    centralIconColor: optionSelectorPanelColors.error,
                    optionText: "Disabled",
                    btnIcon: faCircleXmark,
                    btnPressAction: () => {setAdminNotifLocal("disabled")},
                    btnSelected: state === "disabled",
                }
            ]
        }
    };
    const setAdminNotifLocal = async (newValue) => {
        if(!adminNotifLocalPending && adminData.adminNotifLocal !== newValue){
            adminNotifLocalPending = true;
            
            try{
                await fetch(PUBLIC_API_URL + "/admin/settings/set-email", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                    body: JSON.stringify({
                        adminNotifLocal: newValue === "enabled",
                        location: currentLocation,
                    }),
                })
            } catch{} finally{
                await refreshAdminData(false);
                adminNotifLocalPending = false;
            }
        }
    }

    $: refreshAdminNotifEditLocalPanelData(adminData.adminNotifEditLocal, adminNotifEditLocalPending);
    let adminNotifEditLocalPanelData;
    const refreshAdminNotifEditLocalPanelData = (state, pending) => {
        adminNotifEditLocalPanelData = {
            title: "Admin (Edits)",
            currentlyLoading: pending,
            options: [
                {
                    centralIcon: faCircleCheck,
                    centralIconColor: optionSelectorPanelColors.success,
                    optionText: "Enabled",
                    btnIcon: faCircleCheck,
                    btnPressAction: () => {setadminNotifEditLocal("enabled")},
                    btnSelected: state === "enabled",
                },
                {
                    centralIcon: faCircleXmark,
                    centralIconColor: optionSelectorPanelColors.error,
                    optionText: "Disabled",
                    btnIcon: faCircleXmark,
                    btnPressAction: () => {setadminNotifEditLocal("disabled")},
                    btnSelected: state === "disabled",
                }
            ]
        }
    };
    const setadminNotifEditLocal = async (newValue) => {
        if(!adminNotifEditLocalPending && adminData.adminNotifEditLocal !== newValue){
            adminNotifEditLocalPending = true;
            
            try{
                await fetch(PUBLIC_API_URL + "/admin/settings/set-email", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                    body: JSON.stringify({
                        adminNotifEditLocal: newValue === "enabled",
                        location: currentLocation,
                    }),
                })
            } catch{} finally{
                await refreshAdminData(false);
                adminNotifEditLocalPending = false;
            }
        }
    }
    
    $: refreshUserNotifGlobalPanelData(adminData.userNotifGlobal, userNotifGlobalPending);
    let userNotifGlobalPanelData;
    const refreshUserNotifGlobalPanelData = (state, pending) => {
        userNotifGlobalPanelData = {
            title: "User (Own Replies)",
            currentlyLoading: pending,
            options: [
                {
                    centralIcon: faCircleCheck,
                    centralIconColor: optionSelectorPanelColors.success,
                    optionText: "Enabled",
                    btnIcon: faCircleCheck,
                    btnPressAction: () => {setUserNotifGlobal("enabled")},
                    btnSelected: state === "enabled",
                },
                {
                    centralIcon: faCircleXmark,
                    centralIconColor: optionSelectorPanelColors.error,
                    optionText: "Disabled",
                    btnIcon: faCircleXmark,
                    btnPressAction: () => {setUserNotifGlobal("disabled")},
                    btnSelected: state === "disabled",
                }
            ]
        }
    };
    const setUserNotifGlobal = async (newValue) => {
        if(!userNotifGlobalPending && adminData.userNotifGlobal !== newValue){
            userNotifGlobalPending = true;
            
            try{
                await fetch(PUBLIC_API_URL + "/admin/settings/set-email", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                    body: JSON.stringify({
                        userNotifGlobal: newValue === "enabled",
                        location: currentLocation,
                    }),
                })
            } catch{} finally{
                await refreshAdminData(false);
                userNotifGlobalPending = false;
            }
        }
    }

    $: refreshUserNotifLocalPanelData(adminData.userNotifLocal, userNotifLocalPending);
    let userNotifLocalPanelData;
    const refreshUserNotifLocalPanelData = (state, pending) => {
        userNotifLocalPanelData = {
            title: "User (Own Replies)",
            currentlyLoading: pending,
            options: [
                {
                    centralIcon: faCircleCheck,
                    centralIconColor: optionSelectorPanelColors.success,
                    optionText: "Enabled",
                    btnIcon: faCircleCheck,
                    btnPressAction: () => {setUserNotifLocal("enabled")},
                    btnSelected: state === "enabled",
                },
                {
                    centralIcon: faCircleXmark,
                    centralIconColor: optionSelectorPanelColors.error,
                    optionText: "Disabled",
                    btnIcon: faCircleXmark,
                    btnPressAction: () => {setUserNotifLocal("disabled")},
                    btnSelected: state === "disabled",
                }
            ]
        }
    };
    const setUserNotifLocal = async (newValue) => {
        if(!userNotifLocalPending && adminData.userNotifLocal !== newValue){
            userNotifLocalPending = true;
            
            try{
                await fetch(PUBLIC_API_URL + "/admin/settings/set-email", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                    },
                    body: JSON.stringify({
                        userNotifLocal: newValue === "enabled",
                        location: currentLocation,
                    }),
                })
            } catch{} finally{
                await refreshAdminData(false);
                userNotifLocalPending = false;
            }
        }
    }


    let configExpandedPageDetection = false;
    let configExpandedAutomod = false;

	$: refreshFilterItems(configExpandedAutomod);

	let filterItemsPending = true;

	let filterItemsSendStatus = "ready";	//ready, pending, error, success  
	let filterItemsSendTimeout;

	const contentFilterActions = 
	{
		BlockPosting: 0,
		Ban: 1,
		BanAndDeleteAll: 2,
		Notify: 3,
		SendToModQueue: 4,
	}

    let contentFilters = [];

    let contentFilterActionsDropdownElements = [
		{ value: 0, label: `Prevent Posting and Return Error Message` },
		{ value: 1, label: `Ban User` },
		{ value: 2, label: `Ban User and Delete All Comments` },
		{ value: 4, label: `Send to Manual Moderation Queue` },
		{ value: 3, label: `Notify Admins` },
	];

    const contentFilterItemActionChange = (filterItem) => {
        if(filterItem.matchAction === contentFilterActions.Notify){
            filterItem.notifyAdmins = true;
        }
        if(filterItem.matchAction !== contentFilterActions.BlockPosting){
            filterItem.returnError = "";
        }
    }

	const refreshFilterItems = async (dummyVar) => {
		if(!configExpandedAutomod) return;

		filterItemsPending = true;

        
        let response, json;
        try{
            response = await fetch(PUBLIC_API_URL + "/admin/settings/moderation-rules", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                },
            })
            json = await response.json();
        } catch{} finally{
			contentFilters = json;
			filterItemsPending = false;
		}
	}

	const sendFilterItems = async () => {
		filterItemsSendStatus = "pending"
		clearTimeout(filterItemsSendTimeout);

        let response;
        try{
            response = await fetch(PUBLIC_API_URL + "/admin/settings/moderation-rules", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                },
                body: JSON.stringify(contentFilters)
            })
        } catch{} finally{
			if (response?.ok) {
				filterItemsSendStatus = "success";
				filterItemsSendTimeout = setTimeout(() => {
					filterItemsSendStatus = "ready";
				}, 3000);
			}
            else{
                filterItemsSendStatus = "error";
                filterItemsSendTimeout = setTimeout(() => {
                    filterItemsSendStatus = "ready";
                }, 1000);
            }
		}
	}

    const shiftFilterItmPos = (index, direction) => {
        const newIndex = direction === "up" ? index - 1 : index + 1;

        if (newIndex >= 0 && newIndex < contentFilters.length) {
            [contentFilters[index], contentFilters[newIndex]] = [
                contentFilters[newIndex],
                contentFilters[index],
            ];
        }
    };
</script>

<section class="panel-container">
    <div class="panel">
        <div class="panel-title">
            <div class="panel-title-text">Admin Panel</div>
            <div class="panel-collapse-btn" class:panel-collapse-btn-flipped={panelCollapsed} role="button" tabindex="0" on:click={() => panelCollapsed = !panelCollapsed} on:keypress={() => panelCollapsed = !panelCollapsed}>
            <Fa icon={faChevronUp}/></div>
        </div>

        {#if !panelCollapsed}
            <br/>
            <div class="panel-row-title">Global Commenting Settings</div>
            <div class="panel-row">
                <AdminPanelOptionSelector data={commentingPanelData}/>
                <AdminPanelOptionSelector data={votePanelData}/>
            </div>

            <div class="panel-row-title">Current Location Commenting Settings</div>
            <div class="panel-row-subtitle">{currentLocation}</div>
            <div class="panel-row">                
                <AdminPanelOptionSelector data={localCommentingPanelData}/>
                {#if adminData.localCommenting !== "uninitialised"}<AdminPanelOptionSelector data={localVotingPanelData}/>{/if}
                {#if adminData.localCommenting !== "uninitialised"}<AdminPanelOptionSelector data={localEditingPanelData}/>{/if}
            </div>

            <div class="panel-row-title">User Settings</div>
            <div class="panel-row">
                <AdminPanelOptionSelector data={accLoginPanelData}/>
                <AdminPanelOptionSelector data={accCreationPanelData}/>
                <AdminPanelOptionSelector data={signOutAllPanelData}/>
            </div>

            <div class="panel-row-title">Email Global Comment Notification Settings</div>
            <div class="panel-row">
                <AdminPanelOptionSelector data={adminNotifGlobalPanelData}/>
                <AdminPanelOptionSelector data={adminNotifEditGlobalPanelData}/>
                <AdminPanelOptionSelector data={userNotifGlobalPanelData}/>
            </div>

            {#if adminData.localCommenting !== "uninitialised"}
                <div class="panel-row-title">Email Local Comment Notification Settings</div>
                <div class="panel-row">
                    <AdminPanelOptionSelector data={adminNotifLocalPanelData}/>
                    <AdminPanelOptionSelector data={adminNotifEditLocalPanelData}/>
                    <AdminPanelOptionSelector data={userNotifLocalPanelData}/>
                </div>
            {/if}
            
            <div class="panel-row-title">Global Statistics</div>
            <div class="panel-row">
                <div class="panel-row-item">
                    <div class="panel-row-item-heading">Users</div>
					{#if !statistics}
						<div class="panel-row-item-stat-highlight"><Fa icon={faCircleNotch} spin /></div>
						<br/>
						<table class="panel-row-item-stat-table" cellspacing="0">
							<tr>
								<th>Time</th>
								<th>Active<br/>Users</th>
							</tr>
							<tr>
								<td>24h</td>
								<td><Fa icon={faCircleNotch} spin /></td>
							</tr>
							<tr>
								<td>7d</td>
								<td><Fa icon={faCircleNotch} spin /></td>
							</tr>
							<tr>
								<td>30d</td>
								<td><Fa icon={faCircleNotch} spin /></td>
							</tr>
							<tr>
								<td>1y</td>
								<td><Fa icon={faCircleNotch} spin /></td>
							</tr>
						</table>
					{:else}
						<div class="panel-row-item-stat-highlight">{formatNumberWithSuffix(statistics.totalUsers)}</div>
						<br/>
						<table class="panel-row-item-stat-table" cellspacing="0">
							<tr>
								<th>Time</th>
								<th>Active<br/>Users</th>
							</tr>
							<tr>
								<td>24h</td>
								<td>{formatNumberWithSuffix(statistics.activeUsers_24h)}</td>
							</tr>
							<tr>
								<td>7d</td>
								<td>{formatNumberWithSuffix(statistics.activeUsers_7d)}</td>
							</tr>
							<tr>
								<td>30d</td>
								<td>{formatNumberWithSuffix(statistics.activeUsers_30d)}</td>
							</tr>
							<tr>
								<td>1y</td>
								<td>{formatNumberWithSuffix(statistics.activeUsers_1y)}</td>
							</tr>
						</table>
					{/if}
                    
                </div>
                <div class="panel-row-item">
                    <div class="panel-row-item-heading">Comments</div>
					{#if !statistics}
						<div class="panel-row-item-stat-highlight"><Fa icon={faCircleNotch} spin /></div>
						<br/>
						<table class="panel-row-item-stat-table" cellspacing="0">
							<tr>
								<th>Time</th>
								<th>New<br/>Comments</th>
							</tr>
							<tr>
								<td>24h</td>
								<td><Fa icon={faCircleNotch} spin /></td>
							</tr>
							<tr>
								<td>7d</td>
								<td><Fa icon={faCircleNotch} spin /></td>
							</tr>
							<tr>
								<td>30d</td>
								<td><Fa icon={faCircleNotch} spin /></td>
							</tr>
							<tr>
								<td>1y</td>
								<td><Fa icon={faCircleNotch} spin /></td>
							</tr>
						</table>
					{:else}
						<div class="panel-row-item-stat-highlight">{formatNumberWithSuffix(statistics.totalComments)}</div>
						<br/>
						<table class="panel-row-item-stat-table" cellspacing="0">
							<tr>
								<th>Time</th>
								<th>New<br/>comments</th>
							</tr>
							<tr>
								<td>24h</td>
								<td>{formatNumberWithSuffix(statistics.newComments_24h)}</td>
							</tr>
							<tr>
								<td>7d</td>
								<td>{formatNumberWithSuffix(statistics.newComments_7d)}</td>
							</tr>
							<tr>
								<td>30d</td>
								<td>{formatNumberWithSuffix(statistics.newComments_30d)}</td>
							</tr>
							<tr>
								<td>1y</td>
								<td>{formatNumberWithSuffix(statistics.newComments_1y)}</td>
							</tr>
						</table>
					{/if}
                </div>
            </div>
            
            <div class="panel-row-title">Configuration</div>

            <div class="panel-row panel-row-fullwidth">
                <div class="panel-row-item panel-row-item-fullwidth" class:panel-row-fullwidth-clickable={!configExpandedAutomod} role="presentation" on:click={() => {if(!configExpandedAutomod) configExpandedAutomod = true}}>
                    <div class="panel-row-item-fullwidth-item-heading">Automatic Comment Moderation
                        <div class="panel-collapse-btn subpanel-collapse-btn" class:panel-collapse-btn-flipped={!configExpandedAutomod} role="button" tabindex="0" on:click={(e) => {e.stopPropagation(); configExpandedAutomod = !configExpandedAutomod}} on:keypress={() => configExpandedAutomod = !configExpandedAutomod}>
                        <Fa icon={faChevronUp}/></div>
                    </div>
                    {#if configExpandedAutomod}
                        <div class="panel-row-item-fullwidth-content">
                            Perform some rudimentary comment content moderation using RegEx. Basic actions can be performed
                            if a new comment or edit matches the RegEx.<br/><br/>

                            Rules are evaluated from top to bottom. Only the first matching rule
                            will be actioned, any following rules will be ignored.<br/><br/>

                            Note: "Send to Manual Moderation Queue" action only applies to new comments, not edits.<br/><br/>
                            
                            Current moderation rules:

							{#if !filterItemsPending}
								<div class="panel-row-item-center content-filters">
									{#each contentFilters as contentFilter, index (index)}
										<div class="content-filter-item">
                                            <div class="content-filter-item-reorder-container">
                                                <button class="content-filter-item-reorder-arrow" on:click={shiftFilterItmPos(index, "up")}><Fa icon={faArrowCircleUp} /></button>
                                                <button class="content-filter-item-reorder-arrow" on:click={shiftFilterItmPos(index, "down")}><Fa icon={faArrowCircleDown} /></button>
                                            </div>
                                            <div class="content-filter-item-inner">
                                                <div class="content-filter-item-close-bar">
                                                    <Tooltip tooltip="Delete Rule">
                                                        <button class="panel-row-item-btn panel-row-input-btn" on:click={() => {contentFilters = contentFilters.filter(item => item !== contentFilter)}}>
                                                            <Fa icon={faTrash} />
                                                        </button>
                                                    </Tooltip>
                                                </div>
                                                <div class="content-filter-item-main">
                                                    <input class="panel-text-input content-filter-input" bind:value={contentFilter.filterRegex} placeholder="Enter RegEx"/>
                                                    <div class="content-filter-item-arrow-right">  <Fa icon={faArrowRight} />  </div>
                                                    <div class="content-filter-item-arrow-down">  <Fa icon={faArrowDown} />  </div>
                                                    <div class="content-filter-dropdown">
                                                        <Dropdown items={contentFilterActionsDropdownElements} bind:value={contentFilter.matchAction} onChange={() => contentFilterItemActionChange(contentFilter)}/>
                                                        
                                                        {#if contentFilter.matchAction === contentFilterActions.BlockPosting}
                                                            <input class="panel-text-input content-filter-input content-filter-response-input" bind:value={contentFilter.returnError} placeholder="Enter Error Message"/>
                                                        {/if}
                                                    </div>
                                                </div>
                                                <br/>
                                                <div class="content-filter-item-secondary">
                                                    <label><input type="checkbox" bind:checked={contentFilter.notifyAdmins} disabled={contentFilter.matchAction === contentFilterActions.Notify} id="admin-notif"/> Notify Admins if triggered</label>
                                                </div>
                                            </div>
										</div>
									{/each}
								</div>

								<div class="panel-row-item-center">
									<Tooltip tooltip="Save Rules">
										<button class="panel-row-item-btn panel-row-input-btn" on:click={sendFilterItems} class:panel-row-item-btn-error={filterItemsSendStatus === "error"} disabled={filterItemsSendStatus !== "ready"}>
											{#if filterItemsSendStatus === "pending"}
												<Fa icon={faSpinner} spin />
											{:else if filterItemsSendStatus === "success"}
												<Fa icon={faCircleCheck} />
											{:else if filterItemsSendStatus === "error"}
												<Fa icon={faExclamationCircle} />
											{:else}
												<Fa icon={faFloppyDisk} />
											{/if}
										</button>
									</Tooltip>
									<Tooltip tooltip="New Rule">
										<button class="panel-row-item-btn panel-row-input-btn" on:click={() => contentFilters = [...contentFilters, {filterRegex: "",matchAction: 1, notifyAdmins: false}]}>
											<Fa icon={faPlusCircle} />
										</button>
									</Tooltip>
								</div>
							{:else}
								<div class="subpanel-loading"><Fa icon={faCircleNotch} spin /></div>
							{/if}
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</section>

<style>

    .panel-container {
		background-color: var(--background-color);
		outline: 1px solid var(--outline-color-grey);
		border-radius: 4px;
    }

	.panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20px 10px 20px 10px;
	}

    .panel-title {
		font-family: "Questrial", sans-serif;
		text-align: center;
		font-size: 2em;
        display: flex;
        align-items: center;
    }

    .panel-title-text {
        width: 100%;
    }

    .panel-collapse-btn {
        font-size: 0.6em;
        display: inline-block;
        margin-left: 10px;
        color: var(--comment-color-grey-dark);
        transition: transform 0.3s ease;
        user-select: none;
        cursor: pointer;
    }

    .panel-collapse-btn-flipped {
		transform: rotate(180deg);
    }

    .panel-row-title {
		font-family: "Questrial", sans-serif;
		text-align: center;
		font-size: 1.5em;
        margin-top: 15px;
    }

    .panel-row-subtitle{
        text-align: center;
    }

    .panel-row {
        display:flex;
        justify-content: center;
        margin: 10px 0;
        flex-wrap: wrap;
    }

    .panel-row-fullwidth {
        width: 100%;
		word-wrap: break-word;
    }

    .panel-row-item {
        display:flex;
        align-items: center;
        flex-direction: column;

        outline: 1px solid var(--outline-color-grey);
        border-radius: 4px;
        padding: 10px;
        margin: 10px;
    }

    .panel-row-item-fullwidth {
        width: 100%;
        max-width: 800px;
        text-align: left;
    }

    .panel-row-item-heading {
        text-align: center;
        font-weight: 600;
        height: 3em;
        display: flex;
        align-items: center;
    }

    .panel-row-item-fullwidth-item-heading {
        font-weight: 500;
        font-size: 1.1em;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .panel-row-item-fullwidth-content {
        margin-top: 20px;
        width: 100%;
    }

    .panel-row-item-btn {
        padding: 3px;
        border-radius: 4px;
        margin: 3px;
        user-select: none;
        cursor: pointer;
        color: var(--comment-color-grey-dark);
        border: none;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 25px;
        height: 25px;
        background-color: transparent;

        transition: background-color 0.2s;
    }

    .panel-row-item-btn:hover {
        background-color: var(--comment-color-grey);
    }

    .panel-row-item-stat-highlight {
        font-size: 2.5em;
    }

    .panel-row-input-btn {
        display: inline-block;
        width: auto;
        padding: 0 10px;
    }

    .panel-row-item-stat-table {
        text-align: center;
        border-collapse:separate;
        border:solid var(--outline-color-grey-dark) 1px;
        border-radius:4px;
    }

    th, td{
        border-left:solid var(--outline-color-grey-dark) 1px;
        border-top:solid var(--outline-color-grey-dark) 1px;
    }
    
    th {
        border-top: none;
        font-weight: 600;
    }
    
    td:first-child, th:first-child {
        border-left: none;
    }

    th:last-child {
        min-width: 100px;
    }
    
    th {
        padding: 0 10px;
    }

    input {
        font: inherit;
        border: none;
        outline: var(--outline-color-grey) solid 1px;
        border-radius: 4px;
        transition: outline 0.05s;
    }

    input:focus {
        border-color: none;
        outline: 3px solid rgba(0, 0, 255, 0.336);
    }

    .panel-row-item-center {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
    }

    .panel-text-input {
        width: min(60%, 300px);
        margin: 5px 0;
    }

    .subpanel-collapse-btn {
        margin: 5px 10px;
    }

    .panel-row-fullwidth-clickable {
        cursor: pointer;
    }

    .content-filters {
        width: 100%;
    }

    .content-filter-item{
        width: 100%;

        outline: 1px solid var(--outline-color-grey);
        margin: 10px 0;
        padding: 5px 8px;
        border-radius: 4px;

        display: flex;
        align-items: center;
    }

    .content-filter-item-reorder-container{
        display: flex;
        flex-direction: column;
        margin-right: 10px;
    }

    .content-filter-item-inner {
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 100%;
    }

    .content-filter-item-reorder-arrow{
        padding: 3px;
        border-radius: 4px;
        margin: 3px;
        user-select: none;
        cursor: pointer;
        color: var(--comment-color-grey-dark);
        border: none;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 25px;
        height: 25px;
        background-color: transparent;

        transition: background-color 0.2s;
    }

    .content-filter-item-reorder-arrow:hover {
        background-color: var(--comment-color-grey);
    }

    .content-filter-item-main {
        width: 100%;
        display: inline-flex;
        justify-content: center;
        align-items: center;
    }

    .content-filter-item-secondary {
        width: 100%;
        display:flex;
        justify-content: center;
        align-items: center;
        margin-top: 5px;
    }

    .content-filter-input {
        flex: 1 1 0px;
        min-width: 0;
        background-color: var(--textarea-background);
        color: var(--text-color);
    }

    .content-filter-dropdown {
        position: relative;
        flex: 1 1 0px;
        min-width: 0;
    }
    
    .content-filter-item-arrow-down {
        display: none;
    }

    .content-filter-response-input {
        width: 100%;
    }

    @media (max-width: 700px) {
        .content-filter-item {
            width: initial;
            margin: 10px 0;
        }

        .content-filter-item-arrow-down {
            display: initial;
        }
        .content-filter-item-arrow-right {
            display: none;
        }

        .content-filter-item-main {
            flex-direction: column;
        }

        .content-filter-input {
            width: min(70vw, 440px);

        }
        
        .content-filter-dropdown {
            width: min(70vw, 440px);
        }

    }

    .content-filter-item-close-bar {
        display: flex;
        justify-content: right;
        margin-bottom: 5px;
    }

	.subpanel-loading {
		display: flex;
    	justify-content: center;
		font-size: 1.5em;
	}

</style>