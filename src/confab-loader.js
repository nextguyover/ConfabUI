var script = document.currentScript;
var PUBLIC_API_URL = script.getAttribute('Confab_API');
var darkModeInitial = sanitiseDarkModeToBool(script.getAttribute('darkModeInitial'));

var scriptOrigin = (new URL(script.src, window.location)).origin;

if(!PUBLIC_API_URL) PUBLIC_API_URL = scriptOrigin;

var shadowRoot = script.parentNode.attachShadow({ mode: 'open' });
var container = document.createElement('div');
var innerStylesLink = document.createElement('link');
var styleEraser = document.createElement('style');

function dispatchEventLightDom(element, event){
    element.dispatchEvent(event);
}

innerStylesLink.rel = "stylesheet";
innerStylesLink.href = scriptOrigin + "/bundle.css";
innerStylesLink.onload = () =>  {
    import(scriptOrigin + '/confab-embed.js').then((module) => {
        module.main(container, shadowRoot, dispatchEventLightDom, darkModeInitial, PUBLIC_API_URL);
		
		document.addEventListener('setConfabDarkMode', function (event) {
			module.setDarkMode(sanitiseDarkModeToBool(event.detail.darkMode));
		});
    });
};

styleEraser.textContent = `
  :host {
    all: initial;
  }
`;

shadowRoot.appendChild(styleEraser);
shadowRoot.appendChild(container);
shadowRoot.appendChild(innerStylesLink);

addFont("https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800&display=swap");
addFont("https://fonts.googleapis.com/css2?family=Questrial&display=swap");
addFont('https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap');

function addFont(url){
    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', url);
    script.appendChild(link);
}

function sanitiseDarkModeToBool(value){
	if(value === true || value === "true"){
		return true;
	} else if(value === false || value === "false" || value === null || value === undefined){
		return false;
	} else {
		console.error(`Darkmode value must be true or false, ${value} is not valid.`);
		return false;
	}
}