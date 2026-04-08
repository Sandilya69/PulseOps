import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Orbit, ShieldCheck, Signal } from "lucide-react";

const telemetryLeft = [
  "SYNC WINDOW: 04:32 UTC",
  "INCIDENT FLOW: STABLE",
  "LATENCY DELTA: -18%",
  "",
  "[OPS GRID ARMED]",
];

const telemetryRight = [
  "REGIONS: 12 ACTIVE",
  "TEAMS: 37 CONNECTED",
  "ALERT DENSITY: LOW",
  "",
  "[AUTH CONSOLE READY]",
];

const missionTags = [
  "MISSION CONTROL",
  "AUTOMATED RESPONSE LAYER",
  "STATUS: NOMINAL",
];

export default function Home() {
  return (
    <div className="font-command relative min-h-screen overflow-hidden bg-[#efe7db] text-[#171310]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(215,107,69,0.18),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.7)_0%,rgba(239,231,219,0.96)_55%,rgba(230,216,198,0.9)_100%)]" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 overflow-hidden">
        <div
          className="absolute inset-x-[-6%] bottom-10 h-40 bg-[#d65f33]"
          style={{
            clipPath:
              "polygon(0 10%, 22% 28%, 41% 20%, 63% 68%, 100% 0, 100% 100%, 0 100%)",
          }}
        />
        <div
          className="absolute inset-x-[-4%] bottom-0 h-48 bg-[#315744]"
          style={{
            clipPath:
              "polygon(0 0, 18% 18%, 35% 8%, 49% 40%, 60% 20%, 75% 30%, 87% 12%, 100% 22%, 100% 100%, 0 100%)",
          }}
        />
      </div>

      <header className="font-terminal relative z-20 flex items-center justify-between px-6 py-6 text-[0.8rem] uppercase tracking-[0.22em] sm:px-10">
        <div className="flex items-center gap-3 text-[#2c2927]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d76b45]" />
          <span>PulseOps // Command Surface</span>
        </div>

        <nav className="flex items-center gap-3 sm:gap-6">
          <a
            href="#mission"
            className="hidden text-[#2c2927]/70 transition hover:text-[#2c2927] md:block"
          >
            Manifest
          </a>
          <a
            href="#intel"
            className="hidden text-[#2c2927]/70 transition hover:text-[#2c2927] md:block"
          >
            Telemetry
          </a>
          <Link
            href="/login"
            className="rounded-full border border-[#2c2927] px-4 py-2 text-[#2c2927] transition hover:bg-[#2c2927] hover:text-[#f6efe5]"
          >
            Sign Up
          </Link>
        </nav>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-88px)] flex-col justify-between px-6 pb-8 sm:px-10">
        <section
          id="mission"
          className="grid flex-1 items-start gap-8 pt-2 lg:grid-cols-[1fr_minmax(0,1.45fr)_1fr] lg:items-center lg:gap-4"
        >
          <div className="font-terminal order-2 hidden whitespace-pre-line text-sm leading-7 text-[#342d29]/85 lg:order-1 lg:block">
            {telemetryLeft.join("\n")}
          </div>

          <div className="order-1 flex flex-col items-center lg:order-2">
            <div className="relative mt-6 flex w-full max-w-5xl flex-col items-center justify-center lg:mt-0">
              <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-56 -translate-y-1/2 rounded-full bg-[#f5ece2]/90 blur-3xl" />

              <div className="relative flex h-[20rem] w-[20rem] items-center justify-center sm:h-[28rem] sm:w-[28rem] lg:h-[44rem] lg:w-[44rem]">
                <div className="absolute inset-0 rounded-full border border-[#d56d45]/35 bg-[radial-gradient(circle_at_52%_34%,#fff9f0_0%,#f7ebdc_42%,#eadcc8_65%,#decebb_100%)] shadow-[inset_0_-40px_120px_rgba(0,0,0,0.05)]" />

                <div
                  className="absolute inset-[6%] rounded-full opacity-95"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 18% 18%, #dd7148 0 5%, transparent 5.6%), radial-gradient(circle at 34% 12%, #dd7148 0 7%, transparent 7.6%), radial-gradient(circle at 44% 24%, #dd7148 0 4%, transparent 4.6%), radial-gradient(circle at 60% 18%, #dd7148 0 7%, transparent 7.8%), radial-gradient(circle at 76% 14%, #dd7148 0 5%, transparent 5.6%), radial-gradient(circle at 83% 28%, #dd7148 0 4%, transparent 4.6%), radial-gradient(circle at 70% 38%, #dd7148 0 8%, transparent 8.8%), radial-gradient(circle at 52% 40%, #dd7148 0 6%, transparent 6.7%), radial-gradient(circle at 30% 42%, #dd7148 0 5%, transparent 5.6%), radial-gradient(circle at 20% 56%, #dd7148 0 8%, transparent 8.8%), radial-gradient(circle at 45% 60%, #dd7148 0 7%, transparent 7.8%), radial-gradient(circle at 66% 62%, #dd7148 0 9%, transparent 9.8%), radial-gradient(circle at 84% 52%, #dd7148 0 6%, transparent 6.7%), radial-gradient(circle at 80% 74%, #dd7148 0 8%, transparent 8.8%), radial-gradient(circle at 58% 82%, #dd7148 0 6%, transparent 6.6%), radial-gradient(circle at 34% 78%, #dd7148 0 7%, transparent 7.6%), radial-gradient(circle at 18% 74%, #dd7148 0 6%, transparent 6.7%)",
                  }}
                />

                <div
                  className="absolute inset-[8%] rounded-full opacity-95"
                  style={{
                    clipPath: "ellipse(34% 64% at 16% 60%)",
                    backgroundImage:
                      "radial-gradient(circle at 26% 16%, #406a57 0 10%, transparent 10.8%), radial-gradient(circle at 44% 28%, #406a57 0 12%, transparent 12.8%), radial-gradient(circle at 24% 38%, #406a57 0 14%, transparent 14.9%), radial-gradient(circle at 56% 46%, #406a57 0 10%, transparent 10.8%), radial-gradient(circle at 22% 56%, #406a57 0 16%, transparent 16.8%), radial-gradient(circle at 46% 68%, #406a57 0 12%, transparent 12.8%), radial-gradient(circle at 18% 78%, #406a57 0 14%, transparent 14.8%), radial-gradient(circle at 48% 86%, #406a57 0 12%, transparent 12.8%)",
                  }}
                />

                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_28%,transparent_0_58%,rgba(0,0,0,0.08)_78%,rgba(0,0,0,0.16)_100%)]" />
              </div>

              <div className="relative -mt-28 flex max-w-5xl flex-col items-center px-2 text-center sm:-mt-40 lg:-mt-56">
                <div className="text-[clamp(4.75rem,16vw,12.5rem)] font-bold uppercase leading-none tracking-[-0.08em] text-[#111111]">
                  PulseOps
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  {missionTags.map((tag) => (
                    <span
                      key={tag}
                      className="font-terminal rounded-full border border-[#2d2926] bg-[#f3eadf]/90 px-4 py-2 text-[0.7rem] uppercase tracking-[0.22em] text-[#2d2926] sm:text-[0.78rem]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="mt-6 max-w-2xl text-sm leading-7 text-[#443933] sm:text-base">
                  Incident response, telemetry, and team coordination arranged like
                  a cinematic command deck instead of another flat dashboard.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/login"
                    className="font-terminal inline-flex items-center justify-center rounded-full bg-[#171310] px-6 py-3 text-sm uppercase tracking-[0.22em] text-[#f6efe5] transition hover:translate-y-[-1px] hover:bg-[#2a2522]"
                  >
                    Open Auth Console
                    <ArrowRight className="ml-3 h-4 w-4" />
                  </Link>
                  <a
                    href="#intel"
                    className="font-terminal inline-flex items-center justify-center rounded-full border border-[#2d2926] px-6 py-3 text-sm uppercase tracking-[0.22em] text-[#2d2926] transition hover:bg-[#2d2926] hover:text-[#f6efe5]"
                  >
                    Review Telemetry
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="font-terminal order-3 hidden whitespace-pre-line text-right text-sm leading-7 text-[#342d29]/85 lg:block">
            {telemetryRight.join("\n")}
          </div>
        </section>

        <section
          id="intel"
          className="relative z-10 flex flex-col gap-6 pb-6 pt-6 md:flex-row md:items-end md:justify-between"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-full border border-[#2d2926]/30 bg-[#f7efe6]/80 p-3">
              <Activity className="h-5 w-5 text-[#d76b45]" />
            </div>
            <div>
              <p className="font-terminal text-[0.75rem] uppercase tracking-[0.24em] text-[#4f433d]">
                Sector 7
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#171310]">
                Escalate faster, resolve cleaner.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-[#4b4039]">
                Built for engineers who want the energy of a mission room with
                the clarity of a modern ops workflow.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatusCard
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Alert Guard"
              value="24/7 Coverage"
            />
            <StatusCard
              icon={<Signal className="h-4 w-4" />}
              label="Signal Quality"
              value="98.4% Clean"
            />
            <StatusCard
              icon={<Orbit className="h-4 w-4" />}
              label="Routing Mesh"
              value="12 Regions"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[12rem] rounded-[1.5rem] border border-[#2d2926]/15 bg-[#f8f1e7]/70 px-4 py-4 shadow-[0_18px_48px_rgba(74,47,31,0.08)] backdrop-blur">
      <div className="flex items-center gap-2 text-[#d76b45]">{icon}</div>
      <p className="font-terminal mt-4 text-[0.68rem] uppercase tracking-[0.24em] text-[#6d5950]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-[#171310]">{value}</p>
    </div>
  );
}
