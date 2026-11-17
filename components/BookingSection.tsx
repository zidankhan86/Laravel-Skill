import { EditText, contentSource } from "./EditBinding";
import { MixedText } from "./Presentation";
import RequestForm from "./RequestForm";
import { COPY } from "../content";

import React from "react";
import {
  Calendar,
  Clock,
  Globe2,
  Phone,
  Mail,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import { BRAND_INFO } from "../constants";

const BookingSection: React.FC = () => {
  return (
    <section id="booking" className="py-24 bg-black relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>

      <div className="container mx-auto px-6">
        <div className="bg-neutral-900 rounded-[3rem] p-8 lg:p-16 border border-white/5 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="w-full lg:w-1/2 space-y-8">
              <h2 className="text-4xl md:text-5xl font-brand font-black leading-tight text-white">
                <EditText source={"settings/homepage/BookingSection_1"}>
                  {COPY.homepage.BookingSection_1}
                </EditText>
                <br />{" "}
                <span className="text-gradient-red">
                  <MixedText
                    editSource={"settings/homepage/BookingSection_2"}
                    text={COPY.homepage.BookingSection_2}
                    phrase="Sales Ecosystem"
                  />
                </span>
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                    <Clock aria-hidden="true" />
                  </div>
                  <div className="text-white">
                    <h3 className="font-bold text-xl mb-1">
                      <EditText source={"settings/homepage/BookingSection_3"}>
                        {COPY.homepage.BookingSection_3}
                      </EditText>
                    </h3>
                    <p className="text-neutral-400">
                      <EditText source={"settings/homepage/BookingSection_4"}>
                        {COPY.homepage.BookingSection_4}
                      </EditText>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                    <Globe2 aria-hidden="true" />
                  </div>
                  <div className="text-white">
                    <h3 className="font-bold text-xl mb-1">
                      <EditText source={"settings/homepage/BookingSection_5"}>
                        {COPY.homepage.BookingSection_5}
                      </EditText>
                    </h3>
                    <p className="text-neutral-400">
                      <EditText source={"settings/homepage/BookingSection_6"}>
                        {COPY.homepage.BookingSection_6}
                      </EditText>
                    </p>
                  </div>
                </div>
              </div>

              <div
                id="contact"
                className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <a
                  href={`mailto:${BRAND_INFO.email}`}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-all text-white"
                >
                  <Mail aria-hidden="true" className="text-red-500" />{" "}
                  <span>
                    <EditText source={"settings/homepage/BookingSection_7"}>
                      {COPY.homepage.BookingSection_7}
                    </EditText>
                  </span>
                </a>
                <a
                  href={`tel:+88${BRAND_INFO.phone}`}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-all text-white"
                >
                  <Phone aria-hidden="true" className="text-red-500" />{" "}
                  <span>
                    <EditText source={"settings/homepage/BookingSection_8"}>
                      {COPY.homepage.BookingSection_8}
                    </EditText>
                  </span>
                </a>
                <a
                  href={`https://wa.me/${BRAND_INFO.whatsapp}`}
                  target="_blank"
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-all text-white"
                >
                  <MessageCircle
                    aria-hidden="true"
                    className="text-green-500"
                  />{" "}
                  <span>
                    <EditText source={"settings/homepage/BookingSection_9"}>
                      {COPY.homepage.BookingSection_9}
                    </EditText>
                  </span>
                </a>
              </div>
            </div>

            <div className="w-full lg:w-1/2">
              <div className="booking-form-panel bg-black/50 p-1 rounded-3xl border border-white/10 min-h-[500px] flex items-center justify-center relative group">
                <RequestForm />
                {/* Visual Flair */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/5 blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
