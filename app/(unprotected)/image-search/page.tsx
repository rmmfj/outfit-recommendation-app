"use client";

import { getLabelStringForImageSearch, handleSearch } from "@/actions/search";
import { storeImageToStorage } from "@/actions/utils/insert";
import ItemList from "@/components/item/item-list";
import ItemListSkeleton from "@/components/item/item-list-skeleton";
import PaginationBar from "@/components/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { LoadingButton } from "@/components/ui/loading-button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Series } from "@/type";
import { createClient } from "@/utils/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import imageCompression from 'browser-image-compression';
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { z } from "zod";
import CustomizationFields from "./customization-fields";
import ImageUploader from "./image-uploader";
import Skeleton from "./skeleton";


const schema = z.object({
  // clothingType: z.enum(["top", "bottom"], {
  //   message: "請選擇服飾類型",
  // }),
  gender: z.enum(["male", "female", "neutral"], { message: "請選擇性別" }),
  // model: z.string().default("gpt-4o"),
  uploadedImage: (typeof window === "undefined"
    ? z.any()
    : z.instanceof(FileList, {
        message: "請上傳圖片",
      })
  ).refine((files) => files.length > 0, "請上傳圖片"),
});

// ProgressBar Component
const ProgressBar = ({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return <Progress value={progress} className='w-full rounded-none h-4' />;
};

// ImageUpload Component
const ImageUpload = ({ onImageUpload }: { onImageUpload: () => void }) => {
  
  return (
    <div id='image-uploader' className='w-full flex-1 flex flex-col gap-4 items-center justify-center h-auto'>
      <div className="w-full flex text-gray-600 items-center justify-start gap-2">
        {/* <h1 className='text-start text-2xl'>
          以服搜服
        </h1> */}
        {/* <TourButton tourName='recommendation' /> */}
      </div>
      <ImageUploader onImageUpload={onImageUpload} />
    </div>
  );
};

// FormFields Component
const FormFields = () => {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { getValues } = useFormContext();

  const onClick = (e: React.FormEvent) => {
    e.preventDefault();
    const values = getValues();
    if (Object.keys(values).every((key) => values[key])) {
      // nextStep();
    } else {
      setErrorMessage("請輸入必要欄位");
    }
  };

  return (
    <div id='form-fields' className='flex-1 flex gap-4 flex-col items-center justify-center h-auto'>
      <CustomizationFields />
    </div>
  );
};

const toHHMMSS = (secs: number) => {
  var hours = Math.floor(secs / 3600);
  var minutes = Math.floor(secs / 60) % 60;
  var seconds = secs % 60;

  return [hours, minutes, seconds]
    .map((v) => (v < 10 ? "0" + v : v))
    .filter((v, i) => v !== "00" || i > 0)
    .join(":");
};

// Overview Component
const Overview = ({
  onConfirm,
  loading,
  isConfirmed
}: {
  onConfirm?: () => void;
  loading: boolean;
  isConfirmed: boolean;
}) => {
  const { getValues } = useFormContext();
  const formData = getValues();
  return (
    <div id='overview' className='flex-1 flex flex-col items-center justify-center h-auto gap-4'>
      <h1 className='w-full text-start text-2xl text-gray-600'>➌ 確認上傳</h1>
      <div>
        <Image
          src={formData.uploadedImage ? URL.createObjectURL(formData.uploadedImage[0]) : 'https://eapzlwxcyrinipmcdoir.supabase.co/storage/v1/object/public/image/image-018f80af-65bb-48fd-ba2f-43051785c660'}
          alt='Uploaded'
          className='w-80 h-80 object-cover rounded-lg mb-4'
          width={128}
          height={128}
        />
        <div className='flex'>
          <div className='flex flex-row w-full items-center gap-4'>
            <Badge className='bg-indigo-300 hover:bg-indigo-300'>性別</Badge>
            <p>{formData.gender === "male" ? "男性 🙋‍♂️" : "女性 🙋‍♀️"}</p>
          </div>
        </div>
      </div>
      <ConfirmButton isConfirmed={isConfirmed} disabled={false}/>
    </div>
  );
};

function ConfirmButton({ isConfirmed, disabled }: { isConfirmed: boolean, disabled: boolean }) {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      className={cn('w-full text-white font-bold rounded-lg',
        isConfirmed
          ? "bg-red-400 hover:bg-red-300"
          : "bg-indigo-400 hover:bg-indigo-300")
      }
    >
      <LoadingButton
        className={cn(
          "transition-opacity duration-300 w-full px-8 py-2 rounded-md",
          isConfirmed
          ? `bg-red-400 hover:bg-red-300`
          : `bg-indigo-400 hover:bg-indigo-300`,
        )}
        type='submit'
        loading={isConfirmed}
        disabled={disabled}
      >
        {isConfirmed
          ? `終止並退出`
          : "一鍵尋找類似的服飾！"}
      </LoadingButton>
    </motion.div>
  );
}

// Main Component
export default function UploadPage() {
  const searchParams = useSearchParams();
  const currentStep = parseInt(searchParams.get('step') as string) || 1;
  const router = useRouter();
  const methods = useForm({
    resolver: zodResolver(schema),
  });
  const { getValues } = methods;
  const [loading, setLoading] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);


  const [results, setResults] = useState<Series[]>([]);
  const [image, setImage] = useState<string>("");
  const [gender, setGender] = useState<string>("neutral");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [labelString, setLabelString] = useState<string>("");
  const [imageChanged, setImageChanged] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      router.push('/image-search');
    }
    (async () => {
      const supabase = createClient();
      const {
        data: { user: userResponse },
      } = await supabase.auth.getUser();
      if (userResponse) {
        setUserId(userResponse?.id as string);
      }
    })();
  }, []);

  const onSubmit = async (data: any) => {
    setLoading(true);
    setIsConfirmed(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === "string") {
        const base64 = reader.result;
        try {
          const imageUrl = await storeImageToStorage(base64);
          setImage(imageUrl);
          setGender(data.gender);
          // const labelString
          const result  = await getLabelStringForImageSearch(data.gender, "gpt-4o-mini", imageUrl);
          console.log("clothing_type:", result.clothing_type);
          console.log("gender: ", result.gender);
          setLabelString(result.labelString);
          console.log(labelString);
          const res = await handleSearch(
            result.labelString,
            data.gender,
            1,
            userId,
            undefined,
            undefined,
            undefined,
            result.clothing_type
          );
          setIsConfirmed(false);
          setResults([...(res?.series ?? [])] as Series[]);
          setTotalPages(res?.totalPages as number);
          setLoading(false);
          setImageChanged(false);
        } catch (error) {
          console.error("Error in onSubmit:", error);
        }
      }
    };

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    }
    try {
      const compressedFile = await imageCompression(data.uploadedImage[0], options);
      reader.readAsDataURL(compressedFile);
  
    } catch (error) {
      console.log(error);
    }
    
    const NUM_MAX_SUGGESTION: number = 3;
    const NUM_MAX_ITEM: number = 10;
  };

  if (isLoading) {
    return <Skeleton />;
  }

  if(results.length === 0) {
    return (
      <div className='relative w-full h-screen flex flex-col items-center justify-center'>
        <div className='w-full flex-1 h-auto flex flex-col items-center justify-center gap-4'>
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-4">
                <ImageUpload onImageUpload={() => {}} />
                <FormFields />
                <ConfirmButton isConfirmed={isConfirmed} disabled={!getValues()['uploadedImage'] || getValues()['uploadedImage'].length === 0 || !gender}/>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    )
  }else {
    return (
    <div className='relative w-full h-screen flex flex-col items-center justify-start'>
        <div className='w-full flex-1 h-auto flex flex-col items-center justify-start gap-4'>
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-4">
                <ImageUpload onImageUpload={() => {setImageChanged(true)}} />
                <div className="flex justify-center text-gray-400">點擊圖片更換上傳內容</div>
                <FormFields />
                <ConfirmButton isConfirmed={isConfirmed} disabled={!getValues()['uploadedImage'] || getValues()['uploadedImage'].length === 0 || !gender || !imageChanged}/>
              </div>
            </form>
          </FormProvider>
        </div>
        <div className='flex flex-col gap-4 justify-center items-center md:max-w-[80vw]'>
        {loading ? (
            <ItemListSkeleton index={0} />
          ) : (
            <div className='flex flex-col gap-4 justify-center items-center md:max-w-[80vw]'>
              <ItemList
                title='搜尋結果'
                description={""}
                series={results}
                id={0}
                index={0}
                expandOnMount={true} expandable={false} />
                {
                  results.length > 0 &&
                  <div className="mt-8 w-full flex items-center justify-center">
                    <PaginationBar
                      currentPage={page}
                      totalPages={totalPages}
                        onPageChange={async (page: number) => {
                          setPage(page);
                          setLoading(true);
                          console.log(labelString)
                          const res = await handleSearch(labelString, gender, page, userId);
                          console.log(res);
                          setResults([...(res?.series as Series[])] as Series[]);
                          setLoading(false);
                        }}
                    />
                  </div>
                }
            </div>
          )}
        </div>
      </div>
    )
  }
}