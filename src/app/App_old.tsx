        <section className="bg-white px-5 py-28 lg:px-8">
          <div className="mx-auto max-w-[1280px]">

            <div className="grid items-center gap-14 lg:grid-cols-[0.75fr_1.25fr]">

              {/* Intro */}
              <div className="max-w-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
                  Why clients choose KALA
                </p>

                <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl">
                  Relief,
                  <br />
                  delivered.
                </h2>

                <p className="mt-6 text-sm leading-7 text-muted-foreground">
                  You don't need another number to call or another person to
                  coordinate. KALA gives you one place to request a service,
                  communicate, follow progress and get the job completed.
                </p>

                <button
                  onClick={() => navigate("/book")}
                  className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#162b5d]"
                >
                  Book a Service
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </button>
              </div>

              {/* Benefits */}
              <div className="grid gap-4 sm:grid-cols-2">

                {[
                  {
                    icon: Clock3,
                    title: "Less coordination",
                    body: "Tell KALA what you need once. Our operations team handles the coordination.",
                  },
                  {
                    icon: MessageCircle,
                    title: "Clear communication",
                    body: "Keep instructions, updates, approvals and conversations connected to your order.",
                  },
                  {
                    icon: MapPin,
                    title: "Know what's happening",
                    body: "Follow your request from booking through assignment, execution and completion.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "A team you can rely on",
                    body: "KALA oversees the service while the assigned professional handles the work.",
                  },
                  {
                    icon: FileText,
                    title: "Everything stays connected",
                    body: "Your order details, instructions and service history stay together in one place.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Completion matters",
                    body: "We don't stop at assignment. KALA follows the request through to the outcome.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="group rounded-[26px] border border-primary/8 bg-[#F7F4EC] p-7 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_20px_50px_rgba(13,27,62,0.08)]"
                    >
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-accent shadow-sm transition duration-300 group-hover:bg-primary">
                        <Icon className="h-5 w-5 transition group-hover:text-accent" />
                      </div>

                      <h3 className="mt-6 font-display text-xl font-semibold text-primary">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  );
                })}

              </div>
            </div>

          </div>
        </section>