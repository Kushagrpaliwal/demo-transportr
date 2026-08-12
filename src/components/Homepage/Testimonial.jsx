import React, { useState, useEffect } from "react";
import { ReviewService } from "../../api/services/CMSService/Review";

// const reviews = [
//   {
//     name: "Diana Prince",
//     rating: 5,
//     review:
//       "Jane is a great sender! Package was ready on time and exactly as described.",
//     date: "5th September, 2024",
//   },
//   {
//     name: "Bob The Builder",
//     rating: 4,
//     review: "Package was perfectly packed. A pleasure to work with.",
//     date: "20th August, 2024",
//   },
//   {
//     name: "Clark Kent",
//     rating: 5,
//     review: "Excellent service! Fast communication and secure packaging.",
//     date: "15th July, 2024",
//   },
//   {
//     name: "Wonder Woman",
//     rating: 4,
//     review: "Reliable and trustworthy. Will definitely use again!",
//     date: "10th June, 2024",
//   },
// ];

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = date.getDate();
  const getOrdinalSuffix = (n) => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
};

const Testimonial = () => {
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      const res = await ReviewService();
      setReviews(res?.data?.data);
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const nextReview = () => {
    setCurrent((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrent((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const getDisplayTestimonials = () => {
    if (reviews.length === 0) return [];
    if (isMobile) {
      return [reviews[current]];
    } else {
      const items = [];
      const numToShow = Math.min(2, reviews.length);
      for (let i = 0; i < numToShow; i++) {
        items.push(reviews[(current + i) % reviews.length]);
      }
      return items;
    }
  };

  const displayTestimonials = getDisplayTestimonials();

  return (
    <section className="w-full containersec bg-white">
      <div className="py-16 lg:px-4 flex flex-col items-center">
        <h2 className="text-3xl md:text-4xl lg:text-[45px] font-bold text-center text-black mb-2">
          Reviews
        </h2>
        <p className="text-gray-500 md:text-lg text-center mb-10">
          See what Senders and Travellers are saying about their experience with
          our platform
        </p>

        <div className="flex items-center justify-center gap-4 w-full max-w-6xl">
          <button
            onClick={prevReview}
            aria-label="Previous"
            className="flex items-center hover:scale-110 transition-all border-2 min-w-[32px] border-[#4681F4] justify-center w-8 h-8 rounded-full cursor-pointer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="rotate-180"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="#4681F4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            className={`gap-6 w-full justify-center ${isMobile ? "flex" : "md:flex"}`}
          >
            {displayTestimonials.map((review) => (
              <div
                key={`${current}-${review.id}`}
                className={`bg-white rounded-2xl shadow pb-12 sm:pb-8 p-8 pl-1.5 relative flex flex-row gap-2 ${
                  isMobile
                    ? "w-full max-w-[500px] mx-auto"
                    : "w-full max-w-[500px]"
                } min-w-[260px]`}
              >
                <img
                  src="./comas.svg"
                  alt="commaimages"
                  className="lg:w-20 w-10 h-10 lg:h-20 relative top-0"
                />
                <div className="flex flex-col items-start gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    {[...Array(review?.rating)].map((i) => (
                      <svg
                        key={i}
                        width="18"
                        height="18"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                          fill="#FFD700"
                        />
                      </svg>
                    ))}
                    {[...Array(5 - review?.rating)].map((i) => (
                      <svg
                        key={i}
                        width="18"
                        height="18"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                          fill="gray"
                        />
                      </svg>
                    ))}
                    <span className="text-gray-700 font-semibold ml-1">
                      {review?.rating || 5}
                    </span>
                  </div>
                  <h3 className="font-semibold text-xl text-black mb-1">
                    {review?.name || "Anonymous"}
                  </h3>
                  <p className="text-black text-lg mb-2">{review?.content}</p>
                  <div className="flex justify-between items-end w-full">
                    <span className="text-black text-base">
                      {formatDate(review?.createdAt || review?.date)}
                    </span>
                  </div>
                </div>
                <img
                  src="./comas.svg"
                  alt="commaimages"
                  className="rotate-180 lg:w-20 w-10 h-10 lg:h-20 absolute right-1 bottom-5 sm:bottom-0"
                />
              </div>
            ))}
          </div>

          <button
            onClick={nextReview}
            aria-label="Next"
            className="flex items-center hover:scale-110 transition-all border-2 min-w-[32px] border-[#4681F4] justify-center w-8 h-8 rounded-full cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 18L15 12L9 6"
                stroke="#4681F4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
