var rhit = rhit || {};

rhit.COLLECTION_PHOTOS = "Photos";
rhit.KEY_IMAGE_URL = "imageURL";
rhit.KEY_CAPTION = "caption";
rhit.KEY_LAST_UPDATED = "LastTouched";
rhit.KEY_AUTHOR = "author";
rhit.photoBucketManager = null;
rhit.singlePhotoManager = null;
rhit.authManager = null;
rhit.pageUrl = "/mainpage.html";
function convertHtmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.ListPageController = class {
	constructor() {

		document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
			button.addEventListener("click", (event) => {
				console.log("try");
				const imageURL = document.querySelector("#inputImageURL").value;
				const caption = "try";
				rhit.photoBucketManager.addPhoto(imageURL, caption);
			});
		});
	

		document.querySelector("#menuShowAllPhotos").addEventListener("click", (event) => {
			window.location.href = "/mainpage.html";
		});
		document.querySelector("#menuShowMyPhotos").addEventListener("click", (event) => {
			// window.location.href = `/mainpage.html?uid=${rhit.authManager.uid}`;
			window.location.href = `/cart.html`;
		});
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.authManager.signOut();
		});
		document.querySelector("#placeAnOrder").addEventListener("click",(event)=>{
			window.location.href = "/orderDescription.html";
			rhit.pageUrl = "/orderDescription.html";
		});
		// document.querySelector("#submitAddPhoto").addEventListener("click", (event) => {
		// 	const imageURL = document.querySelector("#inputImageURL").value;
		// 	const caption = document.querySelector("#inputCaption").value;
		// 	rhit.photoBucketManager.addPhoto(imageURL, caption);
		// });

		$("#addPhotoDialog").on("show.bs.modal", (event) => {
			document.querySelector("#inputImageURL").value = "";
			document.querySelector("#inputCaption").value = "";
		});
		$("#addPhotoDialog").on("shown.bs.modal", (event) => {
			document.querySelector("#inputImageURL").focus();
		});
		rhit.photoBucketManager.startListening(this.updatePhotoList.bind(this));
	}
	updatePhotoList() {
		console.log("Updating the photo list on the page");

		const newPhotoList = convertHtmlToElement('<div id="columns"></div>');
		for (let i = 0; i < rhit.photoBucketManager.numberOfPhotos; i++) {
			const photo = rhit.photoBucketManager.getPhotoByIndex(i);
			const photoCard = this.createPhotoCard(photo);

			photoCard.onclick = () => {
				window.location.href = `/cart.html?id=${photo.id}`;
			}

			newPhotoList.appendChild(photoCard);
		}
		const oldPhotoList = document.querySelector("#columns");
		oldPhotoList.removeAttribute("id");
		oldPhotoList.hidden = true;
		oldPhotoList.parentElement.appendChild(newPhotoList);
	}
	createPhotoCard(photo) {
		return convertHtmlToElement(`<div class="pin" id="${photo.id}">
        <img src="${photo.imageURL}" alt="${photo.caption}">
        <p class="caption">${photo.caption}</p>
      </div>`);
	}
}

rhit.Photo = class {
	constructor(id, imageURL, caption) {
		this.id = id;
		this.imageURL = imageURL;
		this.caption = caption;
	}
}

rhit.PhotoBucketManager = class {
	constructor(userId) {
		this.userId = userId;
		this.documentSnapshots = [];
		this.dbRef = firebase.firestore().collection(rhit.COLLECTION_PHOTOS);
		this.unsubscribe = null;
	}
	addPhoto(imageURL, caption){
		this.dbRef.add({
			[rhit.KEY_IMAGE_URL]: imageURL,
			[rhit.KEY_CAPTION]: caption,
			[rhit.KEY_LAST_UPDATED]: firebase.firestore.Timestamp.now(),
			[rhit.KEY_AUTHOR]: rhit.authManager.uid,
		})
		.then(docRef => {
			console.log("Document written with ID: ", docRef.id);
		})
		.catch(error => {
			console.error("Error adding document: ", error);
		});
	}
	startListening(changeListener){
		let query = this.dbRef.orderBy(rhit.KEY_LAST_UPDATED, "desc").limit(50);
		if (this.userId) {
			query = query.where(rhit.KEY_AUTHOR, "==", this.userId);
		}
		this.unsubscribe = query.onSnapshot(querySnapshot => {
			console.log("PhotoBucket update");
			this.documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	stopListening(){
		this.unsubscribe();
	}
	get numberOfPhotos(){
		return this.documentSnapshots.length;
	}
	getPhotoByIndex(index){
		const doc = this.documentSnapshots[index];
		return new rhit.Photo(
			doc.id,
			doc.get(rhit.KEY_IMAGE_URL),
			doc.get(rhit.KEY_CAPTION));
	}
}

rhit.PhotoPageController = class {
	constructor() {
		document.querySelector("#menuSignOut").addEventListener("click", () => {
			rhit.authManager.signOut();
		});

		document.querySelector("#submitEditCaption").addEventListener("click", () => {
			const caption = document.querySelector("#inputCaption").value;
			rhit.singlePhotoManager.updateCaption(caption);
		});

		$("#editPhotoDialog").on("show.bs.modal", () => {
			document.querySelector("#inputCaption").value = rhit.singlePhotoManager.caption;
		});
		$("#editPhotoDialog").on("shown.bs.modal", () => {
			document.querySelector("#inputCaption").focus();
		});

		document.querySelector("#submitDeletePhoto").addEventListener("click", () => {
			rhit.singlePhotoManager.deletePhoto().then(() => {
				console.log("Photo successfully deleted");
				window.location.href = "/mainpage.html";
			}).catch(error => {
				console.error("Error removing photo: ", error);
			});
		});

		rhit.singlePhotoManager.startListening(this.updatePhotoView.bind(this));
	}
	updatePhotoView() {
		document.querySelector("#photo").src = rhit.singlePhotoManager.imageURL;
		document.querySelector("#caption").textContent = rhit.singlePhotoManager.caption;
		if (rhit.singlePhotoManager.author === rhit.authManager.uid) {
			document.querySelector("#menuEdit").style.display = "flex";
			document.querySelector("#menuDelete").style.display = "flex";
		}
	}
}

rhit.SinglePhotoManager = class {
	constructor(photoId) {
		this.documentSnapshot = {};
		this.unsubscribe = null;
		this.dbRef = firebase.firestore().collection(rhit.COLLECTION_PHOTOS).doc(photoId);
	}
	startListening(changeListener) {
		this.unsubscribe = this.dbRef.onSnapshot(doc => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this.documentSnapshot = doc;
				changeListener();
			} else {
				console.log("No such document!");
			}
		});
	}
	stopListening() {
	  this.unsubscribe();
	}
	updateCaption(caption) {
		this.dbRef.update({
			[rhit.KEY_CAPTION]: caption,
			[rhit.KEY_LAST_UPDATED]: firebase.firestore.Timestamp.now(),
		})
		.then(() => {
			console.log("Document successfully updated");
		})
		.catch(error => {
			console.error("Error updating document: ", error);
		});
	}
	deletePhoto() {
		return this.dbRef.delete();
	}
	get imageURL() {
		return this.documentSnapshot.get(rhit.KEY_IMAGE_URL);
	}
	get caption() {
		return this.documentSnapshot.get(rhit.KEY_CAPTION);
	}
	get author() {
		return this.documentSnapshot.get(rhit.KEY_AUTHOR);
	}
}



rhit.AuthManager = class {
	constructor() {
		this.user = null;
		console.log("Auth Manager initialized");
	}
	startListening(changeListener) {
		firebase.auth().onAuthStateChanged(user => {
			this.user = user;
			changeListener();
		});
	}
	signOut() {
		firebase.auth().signOut().catch(error => {
			console.error("Sign out error:", error);
		});
	}
	get isSignedIn() {
		return !!this.user;
	}
	get uid() {
		return this.user.uid;
	}
}

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.authManager.isSignedIn) {
		// window.location.href = `${rhit.pageUrl}`;
	}
	if (!document.querySelector("#loginPage") && !rhit.authManager.isSignedIn) {
		window.location.href = "/";
	}
};

rhit.initializePage = function () {
	if(document.querySelector("#listPage")) {
		const urlParams = new URLSearchParams(window.location.search);
		const userId = urlParams.get("uid");
		rhit.photoBucketManager = new rhit.PhotoBucketManager(userId);
		new rhit.ListPageController();
	}
	if(document.querySelector("#detailPage")) {
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		const photoId = urlParams.get("id");
		if (!photoId) {
			window.location.href = "/"
		}
		rhit.singlePhotoManager = new rhit.SinglePhotoManager(photoId);
		new rhit.PhotoPageController();
	}
	if(document.querySelector("#loginPage")) {
		rhit.startFirebaseUI();
		new rhit.LoginPageController();
	}
};

rhit.startFirebaseUI = function () {
	var uiConfig = {
        signInSuccessUrl: '/mainpage.html',
        signInOptions: [
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
          firebase.auth.PhoneAuthProvider.PROVIDER_ID,
          firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
        ],
      };
      const ui = new firebaseui.auth.AuthUI(firebase.auth());
      ui.start('#firebaseui-auth-container', uiConfig);
}

function searchItems(value) {
    const searchTerm = value.toLowerCase().trim();

    // Define mappings from keywords to element IDs
    const keywordToSection = {
        'rackets': 'rackets',
        'shoes': 'shoes',
        'bags': 'bags'
    };

    // Find the section ID based on the search term
    Object.keys(keywordToSection).forEach(key => {
        if (searchTerm.includes(key)) {
            const sectionId = keywordToSection[key];
            document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
        }
    });
}

rhit.main = function () {
	rhit.authManager = new rhit.AuthManager();
	rhit.authManager.startListening(() => {
		rhit.checkForRedirects();
		rhit.initializePage();
	});
};

rhit.main();

