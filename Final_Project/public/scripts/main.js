var rhit = rhit || {};
 
rhit.main = function () {
    console.log("Ready");
 
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            var displayName = user.displayName;
            var email = user.email;
            var photoURL = user.photoURL;
            var isAnonymous = user.isAnonymous;
            var phoneNumber = user.phoneNumber;
            var uid = user.uid;
        } else {
            console.log("No user is signed in.");
        }
    });
 
    const inputEmailEl = document.querySelector("#inputEmail");
    const inputPasswordEl = document.querySelector("#inputPassword");
 
    document.querySelector("#createAccountButton").onclick = (event) => {
        console.log(`Create account for email: ${inputEmailEl.value}  password: ${inputPasswordEl.value}`);
        firebase.auth().createUserWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value).catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log("Create user error", errorCode, errorMessage);
        });
    };
 
    document.querySelector("#LoginButton").onclick = (event) => {
        console.log(`Log in to existing account for email: ${inputEmailEl.value}  password: ${inputPasswordEl.value}`);
        firebase.auth().signInWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value).catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log("Log in existing user error", errorCode, errorMessage);
        });
    };
 
    document.querySelector("#anonymousAuthButton").onclick = (event) => {
        console.log(`Log in via Anonymous auth`);
 
        firebase.auth().signInAnonymously().catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log("Log in existing user error", errorCode, errorMessage);
        });
    };
 
    document.querySelector("#signOutButton").onclick = (event) => {
        console.log("Sign Out called");
        firebase.auth().signOut().then(function () {
        }).catch(function (error) {
        });
    };
 
    rhit.startFirebaseAuthUi();
};
 
rhit.startFirebaseAuthUi = () => {
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start('#firebaseui-auth-container', {
        signInSuccessUrl: '/',
        signInOptions: [
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            firebase.auth.EmailAuthProvider.PROVIDER_ID,
            firebase.auth.PhoneAuthProvider.PROVIDER_ID,
            firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID,
        ],
    });
}
 
rhit.main();