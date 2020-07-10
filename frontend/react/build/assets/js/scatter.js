var scatterIdentity;
var loggedin = false;
var _identity;
var eos;

document.addEventListener('scatterLoaded', scatterExtension => {
  // Scatter will now be available from the window scope.
  // At this stage the connection to Scatter from the application is
  // already encrypted.
  const scatter = window.scatter;
  console.log(`Scatter loaded: ${scatter}`);
  // It is good practice to take this off the window once you have
  // a reference to it.
  window.scatter = null;
  // If you want to require a specific version of Scatter
  scatter.requireVersion(3.0);

  console.log(`Detecting existing Scatter identity: ${scatter.identity}`);

  if (scatter.identity) {
    console.log(`///// Detected scatter identity in local storage: ${scatter.identity.accounts[0]}`);
    scatterLoggingIn();
    const authres = authScatter(scatter);
    if (authres) {
      scatterLoggedIn(identity);
      loggedin = true;
      // Set up any extra options you want to use eosjs with.
      const eosOptions = {
        chainId:'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
      };
      eos = scatter.eos( network, Eos, eosOptions );
      //~ console.log(eos);
      document.getElementById("btn-buyram").onclick = () => {
        buyRam();
    }



  } else {
    document.getElementById("btn-scatterlogin").onclick = () => {
      const network = {
          blockchain:'eos',
          host:'api.eosnewyork.io',
          port:443,
          protocol:'https',
          chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906"
      };

      if (loggedin) {
        scatter.forgetIdentity();
        scatterLogout();
        loggedin = false;
        console.log(`Logged out of Scatter`);

      } else {
        console.log(`Getting identity..`);
        //scatter.suggestNetwork(network);
        // You can require certain fields
        scatter.getIdentity({
          accounts: [network]
        }).then(identity => {
          console.log(`Got identity.`);
          console.log(identity);
          _identity = identity;
          scatterLoggingIn();

          //...
        }).catch(error => {
          //...
          loggedin = false;
        });
      }
    }
  }

})

async function authScatter(_scatter) {
  try {
    console.log(`Authenticating..`);
    const res = await _scatter.authenticate();
    if (res) {
      console.log(`Authenticate result: ${res}`);
      return res;
    } else {
      console.log(`Authentication error`);
      _scatter.forgetIdentity();
      loggedin = false;
    }

  } catch(e) {
    console.log(`Caught auth error: ${e}`);
    _scatter.forgetIdentity();
    scatterLogout();
    loggedin = false;
  }
}

function scatterLoggingIn() {
  // set conn status to logging in
  // set scatter button text to logging in
  // set scatter button status to disabled
  // set scatter button style to 'btn-light'
  document.getElementById("scatter-connstatus").innerHTML = `<img src="assets/images/scatter.jpg" id="scatterlogo"> <span class="badge badge-info">Logging in...</span>`;
  document.getElementById("btn-scatterlogin").innerHTML = `Logging in...`;
  document.getElementById("btn-scatterlogin").classList.add("disabled");
  document.getElementById("btn-scatterlogin").classList.remove("btn-primary");
  document.getElementById("btn-scatterlogin").classList.add("btn-light");
}

function scatterLoggedIn(_identity) {
  // set conn status to authenticated
  // set scatter button text to Logout Identity
  // set scatter button status to enabled (remove disabled class)
  // set scatter button style to 'btn-warning'
  document.getElementById("scatter-connstatus").innerHTML = `<img src="assets/images/scatter.jpg" id="scatterlogo"> <span class="badge badge-success">Authenticated</span>`;
  document.getElementById("info-scatter-identityname").innerHTML = `Account Name: <b>${_identity.accounts[0].name}</b>`;
  document.getElementById("btn-scatterlogin").innerHTML = `Logout`;
  document.getElementById("btn-scatterlogin").classList.remove("disabled");
  document.getElementById("btn-scatterlogin").classList.remove("btn-primary");
  document.getElementById("btn-scatterlogin").classList.remove("btn-light");
  document.getElementById("btn-scatterlogin").classList.add("btn-warning");
  document.getElementById("scatter-account-summary").classList.remove("hidden");
  document.getElementById("box-orders-sell").classList.remove("hidden");
  document.getElementById("box-orders-buy").classList.remove("hidden");
}

function scatterLogout() {
  // set con status to logged out
  // set scatter button text to Login with Scatter
  // set scatter button style to 'btn-primary'
  document.getElementById("btn-scatterlogin").classList.remove("btn-warning");
  document.getElementById("btn-scatterlogin").classList.add("btn-primary");
  document.getElementById("scatter-connstatus").innerHTML = `<img src="assets/images/scatter.jpg" id="scatterlogo"> <span class="badge badge-warning">Logged Out</span>`;
  document.getElementById("info-scatter-identityname").innerHTML = `Identity Name: <b></b>`;
  document.getElementById("btn-scatterlogin").innerHTML = `Login with Scatter`;
  document.getElementById("scatter-account-summary").classList.add("hidden");
  document.getElementById("box-orders-sell").classList.add("hidden");
  document.getElementById("box-orders-buy").classList.add("hidden");
}

function buyRam() {
  eos.buyram();
}
