"use client"
import { useCallback, useEffect, useState } from "react"
import s from "./claimsPage.module.css"
import { BriefcaseBusiness, House, Locate } from 'lucide-react';
import { useDropzone } from "react-dropzone"

export default function ClaimsClientPage(
  {currentDisasters} : 
  {currentDisasters: string[]}
) {
  const [step, setStep] = useState(0);
  /* 
  step 0: select disaster
  step 1: choose impact type
  step 2: upload evidence
  step 3: analyse evidence
  */
  const MAX_STEP = 3

  const [disaster, setDisaster] = useState<null | string>(null);
  const [impact, setImpact] = useState<null | string>(null);
  const [gps, setGPS] = useState<null | string>(null);
  const [image, setImage] = useState<null | string>(null);


  function selectDisaster(d: string) {
    setDisaster(d);
  }

  function decrementStep() {
    if (step >= 1) {
      setStep(prev => prev - 1);
    }
  }

  function incrementStep() {
    if (step < MAX_STEP) {
      setStep(prev => prev + 1);
    }
  }

  useEffect(() => {
    if (disaster && step == 0) {
      setStep(1);
    }
  }, [disaster])

  useEffect(() => {
    if (impact && step == 1) {
      setStep(2);
    }
  }, [impact])

  // useEffect(() => {
  //   if (image && step == 2) {
  //     setStep(3);
  //   }
  // }, [image])

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.readAsDataURL(file)

      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const base64 = await fileToBase64(acceptedFiles[0])
    setImage(base64)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": []
    },
    maxFiles: 1
  })

  const recordAnalysis = 0.27
  const gpsAnalysis = 0.27
  const businessAnalysis = 0.27

  return (
    <div className={s.claimsPage}>
      <h1>Submit a claim</h1>
      <div className={s.stepFrame}>
        {step === 0 && 
          <div className={s.activeDisaster}>
            <h2 className={s.header}>Select active disaster</h2>
            <div className={s.disasterList}>
              {currentDisasters.map((d) => <div key={d} onClick={() => setDisaster(d)} className={s.listItem}>{d}</div>)}
            </div>
          </div>
        }
        {step === 1 && 
          <div className={s.impactType}>
            <h2 className={s.header}>Choose Impact Type</h2>
            <div className={s.impactList}>
              <div onClick={() => setImpact("property")} className={s.impactItem}>
                <House />
                Property
              </div>
              <div onClick={() => setImpact("presence")} className={s.impactItem}>
                <Locate />
                Presence
              </div>
              <div onClick={() => setImpact("livelihood")} className={s.impactItem}>
                <BriefcaseBusiness />
                Livelihood
              </div>
            </div>
          </div>
        }
        {step === 2 && (
          <div className={s.uploadEvidence}>
            <h2 className={s.header}>Upload Evidence</h2>

            <div {...getRootProps()} className={s.evidence}>
              <input {...getInputProps()} />

              {isDragActive ? (
                <p>Drop the image here…</p>
              ) : (
                <p>Drag & drop an image here, or click to select</p>
              )}
            </div>

            {image && (
              <div className={s.preview}>
                <h3>Preview</h3>
                <img src={image} alt="evidence" className={s.previewImage} />
              </div>
            )}
          </div>
        )}
        {step === 3 && (
          <div className={s.analyseEvidence}>
            <h2 className={s.header}>Score</h2>
            <div className={s.scores}>
              <div className={s.score}>
                <div className={s.scoreHeader}>Records Analysis</div>
                <div className={s.scoreBox}>
                  <div className={s.scoreText}>
                    {recordAnalysis}
                  </div>
                </div>
              </div>
              <div className={s.score}>
                <div className={s.scoreHeader}>GPS Data</div>
                <div className={s.scoreBox}>
                  <div className={s.scoreText}>
                    {recordAnalysis}
                  </div>
                </div>
              </div>
              <div className={s.score}>
                <div className={s.scoreHeader}>Business Registry</div>
                <div className={s.scoreBox}>
                  <div className={s.scoreText}>
                    {businessAnalysis}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className={s.buttonBox}>
        <button onClick={decrementStep} className="button-solid">
          Previous
        </button>
        <button onClick={incrementStep} className="button-solid">
          Next
        </button>
      </div>
    </div>
  )
}

