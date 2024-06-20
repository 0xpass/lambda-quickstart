"use client";
import { Fragment, useState } from "react";
import { usePassport } from "./hooks/usePassport";
import dynamic from "next/dynamic";

const JsonViewer = dynamic(
  () => import("@textea/json-viewer").then((mod) => mod.JsonViewer),
  { ssr: false }
);

export default function Page() {
  const [username, setUsername] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [authenticateSetup, setAuthenticateSetup] = useState(false);

  const [createLambdaLoading, setCreateLambdaLoading] = useState(false);
  const [lambdaListLoading, setlambdaListLoading] = useState(false);
  const [executeLambdaLoading, setExecuteLambdaLoading] = useState(false);
  const [stateLambdaId, setStateLambdaId] = useState<null | string>(null);
  const [lambdaList, setLambdaList] = useState<null | [any]>();
  const [selectedLambdaId, setSelectedLambdaId] = useState<null | string>(null);

  const [lambdaId, setLambdaId] = useState("");
  const [address, setAddress] = useState<string>();

  const userInput = {
    username: username,
    userDisplayName: username,
  };

  const { passport } = usePassport("07907e39-63c6-4b0b-bca8-377d26445172");

  const lambdaConfig = {
    authorization: {
      type: "none" as "none",
    },
    verifications: {
      count: 1,
    },
    envs: [],
    max_executions: 0,
    conditions: [
      {
        type: "code" as const,
        code: "if (Math.random() < 0.5) { return true; } else { return false; }",
        output_type: "integer" as const,
        substitution: true,
      },
    ],
    triggers: [
      {
        type: "hook",
      },
    ],
    actions: {
      type: "personal_sign" as const,
      check: "",
      data: "0x000000",
      substitution: true,
    },
    postHook: [],
  };

  async function listLambdas() {
    setlambdaListLoading(true);
    try {
      const lambdas = await passport.listLambda();
      setLambdaList(lambdas.result);
      console.log(lambdas.result);
    } catch (err) {
      console.log(err);
    } finally {
      setlambdaListLoading(false);
    }
  }

  async function createLambda() {
    setCreateLambdaLoading(true);
    try {
      const result = await passport.createLambda({
        data: lambdaConfig,
      });

      console.log(result);

      alert(JSON.stringify(result.result));
    } catch (err) {
      console.log(err);
    } finally {
      setCreateLambdaLoading(false);
    }
  }

  async function executeLambda() {
    await passport.setupEncryption();
    setExecuteLambdaLoading(true);
    try {
      const params = {
        data: {
          id: lambdaId ? lambdaId : stateLambdaId!,
          params: [],
        },
      };
      const result = await passport.executeLambda(params);
      if (result.result === "Condition not met") {
        alert("Ooops, probability wasn't on your side...");
      } else {
        alert(
          "Successful Signature Attempt:: " + JSON.stringify(result.result)
        );
      }
    } catch (err) {
      console.log(err);
    } finally {
      setExecuteLambdaLoading(false);
    }
  }

  async function register() {
    setRegistering(true);
    try {
      await passport.setupEncryption();
      const res = await passport.register(userInput);
      console.log(res);

      if (res.result.account_id) {
        setRegistering(false);
        setAuthenticating(true);
        await authenticate();
        setAuthenticating(false);
      }
    } catch (error) {
      console.error("Error registering:", error);
    } finally {
      setRegistering(false);
      setAuthenticating(false);
    }
  }

  async function authenticate() {
    setAuthenticating(true);
    try {
      await passport.setupEncryption();
      const [_, address] = await passport.authenticate(userInput)!;

      console.log(address);
      setAddress(address);
      setAuthenticated(true);
    } catch (error) {
      console.error("Error registering:", error);
    } finally {
      setAuthenticating(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-white text-black">
      <div
        className={`text-2xl font-bold mb-8 ${
          authenticated ? "text-green-500" : "text-red-500"
        }`}
      >
        {authenticated ? "Authenticated" : "Not authenticated"}
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold underline">
          Passport Lambda Quickstart
        </h1>
        <p className="mt-2 text-lg">
          This is a quickstart guide for Passport Lambda's
          {authenticated ? (
            <p className="text-xs text-center mt-8 max-w-[100ch] mb-10">
              You can create executable lambda's based on your lambda config
              below, once you create a lambda you can either execute your active
              'state' lambda, or list your lambda ID's to pick an ID to execute.
              You can click the lambda ids to, toggle the lambda's to see their
              full configuration and status', you'll need to click 'list
              lambdas' again to see any updates after execution
            </p>
          ) : (
            <p className="text-xs mt-8">
              Register / Sign In to start playing aroud with Passport Lambda's
            </p>
          )}
        </p>

        <div className="mt-4 space-y-4">
          {authenticated ? (
            <>
              <div className="flex flex-col mb-12">
                <div className="flex items-center justify-center space-x-6">
                  <div className="font-bold">Address</div>
                  <div>{address}</div>
                </div>
              </div>

              <div className="flex flex-row">
                <div className="w-full">
                  <JsonViewer
                    displayDataTypes={false}
                    theme="light"
                    displaySize={true}
                    rootName={false}
                    value={lambdaConfig}
                  />
                </div>

                <div className="flex flex-col w-full">
                  <div className="mb-3 space-y-2">
                    {lambdaList?.map((lambda) => (
                      <Fragment key={lambda.id}>
                        <div
                          className="text-sm cursor-pointer"
                          onClick={() =>
                            setSelectedLambdaId(
                              selectedLambdaId === lambda.id ? null : lambda.id
                            )
                          }
                        >
                          {lambda.id}
                        </div>
                        {selectedLambdaId === lambda.id && (
                          <JsonViewer
                            displayDataTypes={false}
                            theme="light"
                            defaultInspectDepth={0}
                            displaySize={true}
                            rootName={false}
                            value={lambda}
                          />
                        )}
                      </Fragment>
                    ))}
                  </div>
                  <button
                    onClick={async () => await listLambdas()}
                    className="border border-1 rounded p-2 border-black mb-4 ml-2"
                  >
                    {lambdaListLoading ? "Listing Lambdas..." : "List Lambdas"}
                  </button>

                  <button
                    onClick={async () => await createLambda()}
                    disabled={createLambdaLoading}
                    className="border border-1 rounded p-2 border-black mb-4 ml-2"
                  >
                    {createLambdaLoading
                      ? "Creating Lambda..."
                      : "Create Lambda"}
                  </button>

                  <input
                    value={lambdaId}
                    onChange={(e) => setLambdaId(e.target.value)}
                    className="border border-1 rounded p-2 border-black mb-4 ml-2 text-center"
                    placeholder="Lambda to Execute"
                  />

                  <button
                    onClick={async () => await executeLambda()}
                    disabled={executeLambdaLoading}
                    className="border border-1 rounded p-2 border-black mb-4 ml-2"
                  >
                    {executeLambdaLoading
                      ? "Executing Lambda..."
                      : "Execute Lambda"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (authenticateSetup) {
                  await authenticate();
                } else {
                  register();
                }
              }}
            >
              <div className="mb-12 flex flex-col space-y-2 mt-8">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border border-1 rounded p-2 border-black mb-4 ml-2 text-center"
                  placeholder="Enter unique username"
                />
                <button
                  className="border border-1 rounded p-2 border-black mb-4 ml-2"
                  type="submit"
                  disabled={registering || authenticating}
                >
                  {authenticateSetup
                    ? authenticating
                      ? "Authenticating..."
                      : "Authenticate"
                    : registering
                    ? "Registering..."
                    : authenticating
                    ? "Authenticating..."
                    : "Register"}
                </button>

                <span
                  onClick={() => setAuthenticateSetup(!authenticateSetup)}
                  className="cursor-pointer"
                >
                  {authenticateSetup
                    ? "Register a Passkey?"
                    : "Already have a passkey?"}
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
