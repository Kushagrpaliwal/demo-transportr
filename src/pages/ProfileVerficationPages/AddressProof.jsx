import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { saveStep3AddressProofService } from "../../api/services/ProfileService/profileServices";
import { usePopup } from "../../context/PopupContext";
import { useProfile } from "../../context/ProfileContext";
import LoadingButton from "../../components/Common/LoadingButton";
import { useLocation } from "react-router-dom";

const MIN_FILE_SIZE = 10 * 1024; // 10KB
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const schema = z
  .object({
    address_proof_document_type: z
      .string()
      .min(1, "Please select a document type."),

    hasExistingProof: z.any().optional(),

    proof_of_address: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      !data.hasExistingProof &&
      (!data.proof_of_address || data.proof_of_address.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proof_of_address"],
        message: "Please upload address proof.",
      });
    } else if (data.proof_of_address && data.proof_of_address.length > 0) {
      const f = data.proof_of_address[0];
      if (f.size < MIN_FILE_SIZE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["proof_of_address"],
          message: "Image must be at least 10KB and no larger than 2MB",
        });
      } else if (f.size > MAX_FILE_SIZE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["proof_of_address"],
          message: "Image must be at least 10KB and no larger than 2MB",
        });
      }
    }
  });

const AddressProof = () => {
  const navigate = useNavigate();
  const { profile, fetchProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const { showPopup } = usePopup();
  const location = useLocation();

  const verified = location.state?.isVerified;

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
      address_proof_document_type: "",
    },
  });

  const documentType = watch("address_proof_document_type");
  const file = watch("proof_of_address");
  const hasExistingProof = watch("hasExistingProof");

  const preview = file?.[0] ? URL.createObjectURL(file[0]) : null;

  useEffect(() => {
    if (profile?.data?.verification?.address_proof_document_type) {
      reset({
        address_proof_document_type:
          profile.data.verification.address_proof_document_type,
        hasExistingProof: !!profile.data.verification.proof_of_address_image,
      });
    }
  }, [profile, reset]);

  useEffect(() => {
    const profileDocType =
      profile?.data?.verification?.address_proof_document_type;

    if (documentType !== profileDocType) {
      setValue("hasExistingProof", false);
    } else {
      setValue(
        "hasExistingProof",
        !!profile?.data?.verification?.proof_of_address_image,
      );
    }

    setValue("proof_of_address", null);
  }, [documentType, setValue, profile]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onSubmit = async (data) => {
    let hasNewFiles = false;
    const formdata = new FormData();

    formdata.append(
      "address_proof_document_type",
      data.address_proof_document_type,
    );

    if (data.proof_of_address && data.proof_of_address.length > 0) {
      formdata.append("proof_of_address", data.proof_of_address[0]);
      hasNewFiles = true;
    }

    if (!hasNewFiles) {
      navigate("/dashboard/verification/review");
      return;
    }

    try {
      setLoading(true);
      const response = await saveStep3AddressProofService(formdata);
      // console.log (response);
      if (response.data.success) {
        showPopup(
          response.data.message || "Data Uploaded Successfully",
          "success",
        );
        await fetchProfile();
        if (verified) {
          navigate("/dashboard/verification/review");
        } else {
          navigate("/dashboard/verification/review");
        }
      } else {
        showPopup("Error in uploading data");
      }
    } catch (error) {
      // console.log (error);
      showPopup("Something went wrong while updating data", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full xl:max-w-5xl mx-auto p-4 md:p-8">
      <h5 className="text-[20px] font-semibold text-black">Step 3 of 4</h5>

      <h1 className="text-[26px] font-semibold text-black mb-2">
        Address Proof
      </h1>

      <p className="text-lg font-normal text-[#5F6C85] mb-6">
        Please upload a recent document that confirm your address. This must
        match the address provided in step 1 of 4 Personal Details.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("hasExistingProof")} />
        {/* Document Type */}
        <div className="mb-6">
          <label className="text-base font-medium block mb-2">
            Document Type
          </label>

          <select
            {...register("address_proof_document_type")}
            className="customInputCSS w-full italic"
          >
            <option value="">Select Document Type</option>
            <option value="BankStatement">Bank Statement</option>
            <option value="CreditCardStatement">Credit Card Statement</option>
            <option value="OfficialGovernmentLetter">
              Official Government Letter
            </option>
            <option value="PropertyTaxAssessment">
              Property Tax Assessment
            </option>
            <option value="TaxReturn">Tax Return</option>
            <option value="UtilityBill">Utility Bill</option>
          </select>

          {errors.address_proof_document_type && (
            <p className="text-sm text-red-500 mt-1">
              {errors.address_proof_document_type.message}
            </p>
          )}
        </div>

        {/* File Upload */}
        <div className="mb-2">
          <label className="text-base font-medium block mb-2">
            Address Proof Document
          </label>

          <div className="flex items-center italic bg-[#E6F0FF] rounded-[10px] overflow-hidden">
            <label className={`${!documentType ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 cursor-pointer"} text-white px-6 py-3`}>
              Choose File
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={!documentType}
                {...register("proof_of_address")}
              />
            </label>

            <span className="px-4 text-gray-500">
              {file?.[0]?.name ||
                (hasExistingProof &&
                  profile?.data?.verification?.proof_of_address_image &&
                  profile.data.verification.proof_of_address_image
                    .split("/")
                    .pop()) ||
                "No File Chosen"}
            </span>
          </div>

          {errors.proof_of_address && (
            <p className="text-sm text-red-500 mt-1">
              {errors.proof_of_address.message}
            </p>
          )}

          <p className="text-sm font-normal text-[#5F6C85] mt-1">
            Document must be dated within the last 3 months.
          </p>

          {/* Image Preview */}
          {preview && (
            <div className="mt-3">
              <img
                src={preview}
                alt="Address Preview"
                className="w-48 h-32 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* Buttons */}
        {verified ? (
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <LoadingButton
              loading={loading}
              type="submit"
              className="w-full sm:w-auto text-lg md:text-xl font-bold bg-blue-500 hover:bg-white hover:text-blue-500 border hover:border-blue-500 text-white px-10 py-3 rounded-full cursor-pointer transition-all"
            >
              Save & Continue
            </LoadingButton>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              type="button"
              onClick={() => navigate("/dashboard/verification/identity-scan")}
              className="w-full sm:w-auto text-lg md:text-xl font-bold cursor-pointer border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-8 py-3 rounded-full transition-all"
            >
              Go Back
            </button>

            <LoadingButton
              loading={loading}
              type="submit"
              className="w-full sm:w-auto text-lg md:text-xl font-bold bg-blue-500 hover:bg-white hover:text-blue-500 border hover:border-blue-500 text-white px-10 py-3 rounded-full cursor-pointer transition-all"
            >
              Continue To Review
            </LoadingButton>
          </div>
        )}
      </form>
    </div>
  );
};

export default AddressProof;

{
  /* <option value="">Selected Document Type</option>
<option value="passport">Utility Bill(Gas, Electric, Water)</option>
<option value="passport">Bank Statement</option>
<option value="driving_license">Council tax Bill</option> */
}
