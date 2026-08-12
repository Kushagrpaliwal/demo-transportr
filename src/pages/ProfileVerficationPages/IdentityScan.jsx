import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { saveStep2IdentityProofService } from "../../api/services/ProfileService/profileServices";
import { usePopup } from "../../context/PopupContext";
import { useProfile } from "../../context/ProfileContext";
import LoadingButton from "../../components/Common/LoadingButton";
import { useLocation } from "react-router-dom";

const MIN_FILE_SIZE = 10 * 1024; // 10KB
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const schema = z
  .object({
    documentType: z.string().min(1, "Please select a document type."),
    hasExistingFront: z.any().optional(),
    hasExistingBack: z.any().optional(),
    identity_front: z.any().optional(),
    identity_back: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.hasExistingFront && (!data.identity_front || data.identity_front.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identity_front"],
        message: "Please upload front side of ID.",
      });
    } else if (data.identity_front && data.identity_front.length > 0) {
      const f = data.identity_front[0];
      if (f.size < MIN_FILE_SIZE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["identity_front"],
          message: "Image must be at least 10KB and no larger than 2MB",
        });
      } else if (f.size > MAX_FILE_SIZE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["identity_front"],
          message: "Image must be at least 10KB and no larger than 2MB",
        });
      }
    }

    if (data.documentType !== "Passport") {
      if (!data.hasExistingBack && (!data.identity_back || data.identity_back.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["identity_back"],
          message: "Please upload back side of ID.",
        });
      } else if (data.identity_back && data.identity_back.length > 0) {
        const f = data.identity_back[0];
        if (f.size < MIN_FILE_SIZE) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["identity_back"],
            message: "Image must be at least 10KB and no larger than 2MB",
          });
        } else if (f.size > MAX_FILE_SIZE) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["identity_back"],
            message: "Image must be at least 10KB and no larger than 2MB",
          });
        }
      }
    }
  });

const IdentityScan = () => {
  const navigate = useNavigate();
  const [loading, SetLoading] = useState(false)
  const { showPopup } = usePopup();
  const location = useLocation()
  const verified = location.state?.isVerified

  const { profile, fetchProfile } = useProfile();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      documentType: "",
    },
  });

  const documentType = watch("documentType");
  const frontFile = watch("identity_front");
  const backFile = watch("identity_back");
  const hasExistingFront = watch("hasExistingFront");
  const hasExistingBack = watch("hasExistingBack");

  const frontPreview =
    frontFile && frontFile[0] ? URL.createObjectURL(frontFile[0]) : null;

  const backPreview =
    backFile && backFile[0] ? URL.createObjectURL(backFile[0]) : null;

  useEffect(() => {
    if (profile?.data?.verification) {
      reset({
        documentType:
          profile.data.verification.document_type?.toLowerCase() === "driverslicense"
            ? "DriversLicense"
            : profile.data.verification.document_type?.toLowerCase() === "passport"
              ? "Passport"
              : "",
        hasExistingFront: !!profile.data.verification.document_image,
        hasExistingBack: !!profile.data.verification.document_image_2,
      });
    }
  }, [profile, reset]);

  useEffect(() => {
    const profileDocType =
      profile?.data?.verification?.document_type?.toLowerCase() === "driverslicense"
        ? "DriversLicense"
        : profile?.data?.verification?.document_type?.toLowerCase() === "passport"
          ? "Passport"
          : "";

    if (documentType !== profileDocType) {
      setValue("hasExistingFront", false);
      setValue("hasExistingBack", false);
    } else {
      setValue("hasExistingFront", !!profile?.data?.verification?.document_image);
      setValue("hasExistingBack", !!profile?.data?.verification?.document_image_2);
    }

    setValue("identity_front", null);
    setValue("identity_back", null);
  }, [documentType, setValue, profile]);

  useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      if (backPreview) URL.revokeObjectURL(backPreview);
    };
  }, [frontPreview, backPreview]);

  const onSubmit = async (data) => {
    let hasNewFiles = false;
    const formdata = new FormData();

    formdata.append("document_type", data.documentType);

    if (data.identity_front && data.identity_front.length > 0) {
      formdata.append("identity_front", data.identity_front[0]);
      hasNewFiles = true;
    }

    if (data.identity_back?.[0]) {
      formdata.append("identity_back", data.identity_back[0]);
      hasNewFiles = true;
    }

    if (!hasNewFiles) {
      if (verified) {
        navigate("/dashboard/verification/review");
      } else {
        navigate("/dashboard/verification/address-proof");
      }
      return;
    }

    try {
      SetLoading(true);
      const response = await saveStep2IdentityProofService(formdata);
      if (response.data.success) {
        showPopup(
          response.data.message || "Data Uploaded Successfully",
          "success",
        );
        await fetchProfile();
        if (verified) {
          navigate("/dashboard/verification/review");
        } else {
          navigate("/dashboard/verification/address-proof");
        }
      } else {
        showPopup("Error in uploading data");
      }
    } catch (error) {
      //console.log (error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong while updating data";

      showPopup(message, "error");
    } finally {
      SetLoading(false);
    }

    //console.log (data);
  };

  return (
    <div className="w-full xl:max-w-5xl mx-auto p-4 md:p-8">
      <h5 className="text-[20px] font-semibold text-black">Step 2 of 4</h5>

      <h1 className="text-[26px] font-semibold text-black mb-2">
        Identity Scan
      </h1>

      <p className="text-lg font-normal text-[#5F6C85] mb-2">
        For community safety, please upload a photo of your ID. This data is
        encrypted and secure.
      </p>
      {/* <p className="text-sm font-normal text-[#5F6C85] mb-6">
        Each image must be between 10KB and 2MB.
      </p> */}

      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("hasExistingFront")} />
        <input type="hidden" {...register("hasExistingBack")} />
        <div className="mb-6">
          <label className="text-base font-medium block mb-2">
            Document Type
          </label>

          <select
            {...register("documentType")}
            className="customInputCSS w-full italic"
          >
            <option value="">Selected Document Type</option>
            <option value="Passport">Passport</option>
            <option value="DriversLicense">Driving License</option>
          </select>

          {errors.documentType && (
            <p className="text-sm text-red-500 mt-1">
              {errors.documentType.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="text-base font-medium block mb-2">
            {documentType === "DriversLicense" ? "ID Front Side" : "ID Document"}
          </label>

          <div className="flex items-center italic bg-[#E6F0FF] rounded-[10px] overflow-hidden">
            <label className={`${!documentType ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 cursor-pointer"} text-white px-6 py-3`}>
              Choose File
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={!documentType}
                {...register("identity_front")}
              />
            </label>

            <span className="px-4 text-gray-500">
              {frontFile?.[0]?.name ||
                (hasExistingFront &&
                  profile?.data?.verification?.document_image &&
                  profile.data.verification.document_image.split("/").pop()) ||
                "No File Chosen"}
            </span>
          </div>

          {errors.identity_front && (
            <p className="text-sm text-red-500 mt-1">
              {errors.identity_front.message}
            </p>
          )}

          {/* Image Preview */}
          {frontPreview && (
            <div className="mt-3">
              <img
                src={frontPreview}
                alt="Front Preview"
                className="w-48 h-32 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        {documentType !== "Passport" && documentType && (
          <div className="mb-4">
            <label className="text-base font-medium block mb-2">
              ID Back Side
            </label>

            <div className="flex items-center italic bg-[#E6F0FF] rounded-[10px] overflow-hidden">
              <label className="bg-blue-500 text-white px-6 py-3 cursor-pointer">
                Choose File
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  {...register("identity_back")}
                />
              </label>

              <span className="px-4 text-gray-500">
                {backFile?.[0]?.name ||
                  (hasExistingBack &&
                    profile?.data?.verification?.document_image_2 &&
                    profile.data.verification.document_image_2
                      .split("/")
                      .pop()) ||
                  "No File Chosen"}
              </span>
            </div>

            {errors.identity_back && (
              <p className="text-sm text-red-500 mt-1">
                {errors.identity_back.message}
              </p>
            )}

            {/* Image Preview */}
            {backPreview && (
              <div className="mt-3">
                <img
                  src={backPreview}
                  alt="Back Preview"
                  className="w-48 h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        )}


        {verified ? (
          <LoadingButton
            loading={loading}
            type="submit"
            className="w-full sm:w-auto text-lg md:text-xl font-bold bg-blue-500 hover:bg-white hover:text-blue-500 border hover:border-blue-500 text-white px-10 py-3 rounded-full cursor-pointer transition-all"
          >
            Save & Continue
          </LoadingButton>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              type="button"
              onClick={() => navigate("/dashboard/verification/personal-details")}
              className="w-full sm:w-auto text-lg md:text-xl font-bold cursor-pointer border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-8 py-3 rounded-full transition-all"
            >
              Go Back
            </button>
            <LoadingButton
              loading={loading}
              type="submit"
              className="w-full sm:w-auto text-lg md:text-xl font-bold bg-blue-500 hover:bg-white hover:text-blue-500 border hover:border-blue-500 text-white px-10 py-3 rounded-full cursor-pointer transition-all"
            >
              Continue To Address Proof
            </LoadingButton>
          </div>
        )}
      </form >
    </div >
  );
};

export default IdentityScan;
