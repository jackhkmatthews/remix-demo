import { json, redirect } from "@remix-run/node";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
  NavLink,
  Link,
  useSubmit,
  useLocation,
} from "@remix-run/react";

import appStylesHref from "./app.css?url";

import { getContacts, createEmptyContact } from "./data";
import { useEffect, useRef } from "react";

export const action = async () => {
  const contact = await createEmptyContact();
  return redirect(`/contacts/${contact.id}/edit`);
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const contacts = await getContacts(q);
  return json({ contacts, q });
};

export default function App() {
  const { contacts, q } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const searchFieldRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const isSubmittingNew = navigation.formData?.get("_action") === "newContact";
  const isSearching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has("q");

  useEffect(() => {
    if (searchFieldRef.current) {
      searchFieldRef.current.value = q || "";
    }
  }, [q]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="sidebar">
          <Link to="/">
            <h1>Remix Contacts</h1>
          </Link>
          <div>
            <Form
              id="search-form"
              role="search"
              action={location.pathname}
              onChange={(event) => {
                const isFirstSearch = q === null;
                submit(event.currentTarget, {
                  replace: !isFirstSearch,
                });
              }}
            >
              <input
                id="q"
                aria-label="Search contacts"
                placeholder="Search"
                type="search"
                defaultValue={q || ""}
                name="q"
                ref={searchFieldRef}
                className={isSearching ? "loading" : ""}
              />
              <div id="search-spinner" aria-hidden hidden={!isSearching} />
            </Form>
            <Form method="post">
              <input type="hidden" name="_action" value="newContact" />
              <button type="submit" disabled={isSubmittingNew}>
                {isSubmittingNew ? "loading" : "New"}
              </button>
            </Form>
          </div>
          <nav>
            {contacts.length ? (
              <ul>
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <NavLink
                      to={`contacts/${contact.id}${q ? `?q=${q}` : ""}`}
                      className={({ isActive, isPending }) =>
                        isActive ? "active" : isPending ? "pending" : ""
                      }
                    >
                      {contact.first || contact.last ? (
                        <>
                          {contact.first} {contact.last}
                          <div
                            id="search-spinner"
                            aria-hidden
                            hidden={
                              navigation.formAction !==
                              `/contacts/${contact.id}/destroy`
                            }
                          />
                        </>
                      ) : (
                        <i>No Name</i>
                      )}{" "}
                      {contact.favorite ? <span>★</span> : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                <i>No contacts</i>
              </p>
            )}
          </nav>
        </div>

        <div
          id="detail"
          className={
            navigation.state === "loading" && !isSearching ? "loading" : ""
          }
        >
          <Outlet />
        </div>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
