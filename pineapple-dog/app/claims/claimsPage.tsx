"use client"
import { useCallback, useEffect, useState } from "react"
import s from "./claimsPage.module.css"
import { ArrowLeft, BriefcaseBusiness, House, Locate } from 'lucide-react';
import { useDropzone } from "react-dropzone"
import Link from "next/link";

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
    <main className="min-h-screen bg-slate-900 relative font-sans text-slate-100 selection:bg-[#6366F1]/30">
        {/* Background Ambient Glow */}
        <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[60vh] bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_transparent_70%)] pointer-events-none z-0" />

        {/* Nav */}
        <nav className="w-full flex justify-between items-center py-6 px-6 md:px-10 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
            <Link
                href="/dashboard"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>

        </nav>
        <div className={s.modal}>
          <div className={s.claimsPage}>
            <h1 className={s.title}>Submit a claim</h1>
            <div className={s.stepFrame}>
              {step === 0 && 
                <div className={s.activeDisaster}>
                  <h2 className={s.header}>Select active disaster ({currentDisasters.length} results)</h2>
                  <div className={s.disasterList}>
                    {currentDisasters.map((d) => <div key={d} onClick={() => setDisaster(d)} className={`${s.listItem} ${disaster === d && s.active}`}>{d}</div>)}
                  </div>
                </div>
              }
              {step === 1 && 
                <div className={s.impactType}>
                  <h2 className={s.header}>Choose Impact Type</h2>
                  <div className={s.impactList}>
                    <div onClick={() => setImpact("property")} className={`${s.impactItem} ${s.listItem}`}>
                      <House />
                      Property
                    </div>
                    <div onClick={() => setImpact("presence")} className={`${s.impactItem} ${s.listItem}`}>
                      <Locate />
                      Presence
                    </div>
                    <div onClick={() => setImpact("livelihood")} className={`${s.impactItem} ${s.listItem}`}>
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
        </div>
    </main>
    
  )
}



    