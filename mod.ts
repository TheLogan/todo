import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import * as supabase from "https://unpkg.com/@supabase/supabase-js";
import { faker } from "https://cdn.skypack.dev/@faker-js/faker";

async function handleRequest(request: Request): Promise<Response> {
  return new Response(
    `<html>
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi" crossorigin="anonymous" />
        <style>
          body {
            margin: auto;
            max-width: 800px;
          }

          section {
            margin-bottom: 6rem;
          }

          td {
            vertical-align: middle;
          }
        </style>
      </head>
      <body>
        <h1>My Awesomer (than Fireship's) App 🔥 </h1>
        <section id="whenSignedOut">
          <button id="signInBtn" class="btn btn-primary">
            Sign In with Google
          </button>
        </section>
    
        <section id="whenSignedIn" hidden="true">
          <div id="userDetails"></div>
          <button id="signOutBtn" class="btn btn-primary">Sign Out</button>
        </section>
    
        <section id="myThings" hidden="true">
          <h2>My Things</h2>
          <div id="myThingsList"></div>
    
          <button id="createThing" class="btn btn-success">Create a Thing</button>
        </section>
    
        <section id="allThings">
          <h2>All Things</h2>
          <div id="allThingsList"></div>
        </section>
      </body>
    </html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    }
  );
}

serve(handleRequest);
