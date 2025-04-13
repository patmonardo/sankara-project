import { SandarbhaSevā, qualitative, quantitative } from "./service";
import { 
  NiṣpādanaPhala,
  KriyāPrakāra 
} from "../schema/context";

/**
 * DharmaGuṇaSevā - Property service aligned with Entity-Relation-Property ontology
 * 
 * Properties are implemented as conceptual determinations (der Begriff)
 * emerging from entities (das Sein) through relations (das Wesen).
 * 
 * The service follows the Hegelian progression:
 * Being -> Essence -> Concept
 * Entity -> Relation -> Property
 */
export class DharmaGuṇaSevā {
  /**
   * Set a property on an entity
   */
  static dharmaGuṇaSthāpana(
    sandarbhaId: string,
    vastuId: string,
    guṇaNāma: string,
    mūlya: any,
    lakṣaṇa?: {
      vyutpanna?: boolean;      // derived
      adhikāra?: string[];      // access rights
      saṃvedanīya?: boolean;    // observable
      sthiratā?: "asthāyī" | "sthāyī" | "śāśvata";  // persistence: temporary, persistent, permanent
      vyākaraṇa?: Record<string, any>;  // validation rules
    }
  ): NiṣpādanaPhala {
    return qualitative(sandarbhaId, "dharmaGuṇaSthāpana", () => {
      // Implementation uses Relation to represent Property
      // First, create value entity if complex value
      let valueSambandhaPara = typeof mūlya === 'object' && mūlya !== null 
        ? `dharmaGuṇaMūlya:${Date.now()}`
        : `dharmaGuṇaMūlya:${typeof mūlya}:${Date.now()}`;
        
      // Register value entity if it's complex
      if (typeof mūlya === 'object' && mūlya !== null) {
        SandarbhaSevā.vastuPañjīkaraṇa(sandarbhaId, valueSambandhaPara);
        
        // Store complex object properties as relations
        if (Array.isArray(mūlya)) {
          // For arrays, create index-based relations
          mūlya.forEach((item, index) => {
            DharmaGuṇaSevā.dharmaGuṇaSthāpana(
              sandarbhaId, 
              valueSambandhaPara, 
              `index:${index}`, 
              item,
              { sthiratā: "asthāyī" }
            );
          });
        } else {
          // For objects, create property-based relations
          Object.entries(mūlya).forEach(([key, val]) => {
            DharmaGuṇaSevā.dharmaGuṇaSthāpana(
              sandarbhaId, 
              valueSambandhaPara, 
              key, 
              val,
              { sthiratā: "asthāyī" }
            );
          });
        }
      }
      
      // Create property relation
      const sambandhaId = SandarbhaSevā.guṇātmakaNiṣpādana(
        sandarbhaId,
        "sambandhaNirmāṇa",
        () => {
          const sandarbha = Sandarbha.getSandarbha(sandarbhaId);
          if (!sandarbha) {
            throw new Error(`Sandarbha not found: ${sandarbhaId}`);
          }
          
          return sandarbha.sambandhaNirmāṇa(
            vastuId,                        // source entity
            valueSambandhaPara,             // target value entity
            "dharmaGuṇa",                   // relation type
            {
              guṇaNāma,                     // property name
              mūlya: typeof mūlya !== 'object' ? mūlya : null,  // simple value or null for complex
              lakṣaṇa: lakṣaṇa || {},        // property metadata
              kālamudrā: Date.now()          // timestamp
            }
          );
        }
      );
      
      if (!sambandhaId.saphala) {
        return {
          saphala: false,
          mūlya: null,
          pariṇāma: "guṇātmaka",
          kriyā: "dharmaGuṇaSthāpana",
          sandarbhaId,
          kālamudrā: Date.now(),
          doṣa: sambandhaId.doṣa
        };
      }
      
      return {
        saphala: true,
        mūlya: {
          vastuId,
          guṇaNāma,
          mūlya,
          sambandhaId: sambandhaId.mūlya
        },
        pariṇāma: "guṇātmaka",
        kriyā: "dharmaGuṇaSthāpana",
        sandarbhaId,
        kālamudrā: Date.now()
      };
    });
  }
  
  /**
   * Get a property from an entity
   */
  static dharmaGuṇaPrāpti(
    sandarbhaId: string,
    vastuId: string,
    guṇaNāma: string
  ): NiṣpādanaPhala {
    return qualitative(sandarbhaId, "dharmaGuṇaPrāpti", () => {
      // Find property relations
      const sambandhaResult = SandarbhaSevā.guṇātmakaNiṣpādana(
        sandarbhaId,
        "sambandhāḥPrāpti",
        () => {
          const sandarbha = Sandarbha.getSandarbha(sandarbhaId);
          if (!sandarbha) {
            throw new Error(`Sandarbha not found: ${sandarbhaId}`);
          }
          
          return sandarbha.sambandhāḥPrāpti({
            prakāra: "dharmaGuṇa",
            pūrva: vastuId
          }).filter(s => s.lakṣaṇa?.guṇaNāma === guṇaNāma)
            .sort((a, b) => 
              (b.lakṣaṇa?.kālamudrā || 0) - (a.lakṣaṇa?.kālamudrā || 0)
            );
        }
      );
      
      if (!sambandhaResult.saphala || !Array.isArray(sambandhaResult.mūlya) || sambandhaResult.mūlya.length === 0) {
        return {
          saphala: false,
          mūlya: undefined,
          pariṇāma: "guṇātmaka",
          kriyā: "dharmaGuṇaPrāpti",
          sandarbhaId,
          kālamudrā: Date.now(),
          doṣa: {
            sandeśa: `Property not found: ${guṇaNāma} for entity ${vastuId}`
          }
        };
      }
      
      const sambandha = sambandhaResult.mūlya[0];
      
      // Check if this is a derived property
      if (sambandha.lakṣaṇa?.lakṣaṇa?.vyutpanna) {
        // For derived properties, calculate the value
        return DharmaGuṇaSevā.vyutpannaDharmaGuṇaPrāpti(
          sandarbhaId,
          vastuId,
          guṇaNāma
        );
      }
      
      // If we have simple value, return it directly
      if (sambandha.lakṣaṇa?.mūlya !== null && sambandha.lakṣaṇa?.mūlya !== undefined) {
        return {
          saphala: true,
          mūlya: sambandha.lakṣaṇa.mūlya,
          pariṇāma: "guṇātmaka",
          kriyā: "dharmaGuṇaPrāpti",
          sandarbhaId,
          kālamudrā: Date.now(),
          meta: {
            sambandha,
            lakṣaṇa: sambandha.lakṣaṇa?.lakṣaṇa
          }
        };
      }
      
      // For complex objects, reconstruct from properties
      const targetId = sambandha.para;
      
      // Check if it's an array
      const indexPropertiesResult = SandarbhaSevā.guṇātmakaNiṣpādana(
        sandarbhaId,
        "sambandhāḥPrāpti",
        () => {
          const sandarbha = Sandarbha.getSandarbha(sandarbhaId);
          return sandarbha.sambandhāḥPrāpti({
            prakāra: "dharmaGuṇa",
            pūrva: targetId
          }).filter(s => s.lakṣaṇa?.guṇaNāma.startsWith('index:'));
        }
      );
      
      if (indexPropertiesResult.saphala && Array.isArray(indexPropertiesResult.mūlya) && 
          indexPropertiesResult.mūlya.length > 0) {
        // It's an array, reconstruct
        const arrayItems = indexPropertiesResult.mūlya
          .map(s => ({
            index: parseInt(s.lakṣaṇa?.guṇaNāma.replace('index:', ''), 10),
            value: s.lakṣaṇa?.mūlya
          }))
          .sort((a, b) => a.index - b.index)
          .map(item => item.value);
          
        return {
          saphala: true,
          mūlya: arrayItems,
          pariṇāma: "guṇātmaka",
          kriyā: "dharmaGuṇaPrāpti",
          sandarbhaId,
          kālamudrā: Date.now(),
          meta: {
            saṃyukta: true, // composite
            sambandha,
            prakāra: "array"
          }
        };
      }
      
      // Otherwise it's an object, reconstruct
      const objectPropertiesResult = SandarbhaSevā.guṇātmakaNiṣpādana(
        sandarbhaId,
        "sambandhāḥPrāpti",
        () => {
          const sandarbha = Sandarbha.getSandarbha(sandarbhaId);
          return sandarbha.sambandhāḥPrāpti({
            prakāra: "dharmaGuṇa",
            pūrva: targetId
          });
        }
      );
      
      if (objectPropertiesResult.saphala && Array.isArray(objectPropertiesResult.mūlya)) {
        const reconstructedObject: Record<string, any> = {};
        
        objectPropertiesResult.mūlya.forEach(s => {
          if (s.lakṣaṇa?.guṇaNāma) {
            reconstructedObject[s.lakṣaṇa.guṇaNāma] = s.lakṣaṇa?.mūlya;
          }
        });
        
        return {
          saphala: true,
          mūlya: reconstructedObject,
          pariṇāma: "guṇātmaka",
          kriyā: "dharmaGuṇaPrāpti",
          sandarbhaId,
          kālamudrā: Date.now(),
          meta: {
            saṃyukta: true, // composite
            sambandha,
            prakāra: "object"
          }
        };
      }
      
      // If we got here, something went wrong
      return {
        saphala: false,
        mūlya: undefined,
        pariṇāma: "guṇātmaka",
        kriyā: "dharmaGuṇaPrāpti",
        sandarbhaId,
        kālamudrā: Date.now(),
        doṣa: {
          sandeśa: `Failed to reconstruct complex property: ${guṇaNāma} for entity ${vastuId}`
        }
      };
    });
  }
  
  /**
   * Get all properties of an entity
   */
  static sarvaDharmaGuṇaPrāpti(
    sandarbhaId: string,
    vastuId: string
  ): NiṣpādanaPhala {
    return qualitative(sandarbhaId, "sarvaDharmaGuṇaPrāpti", () => {
      // Find all property relations
      const sambandhaResult = SandarbhaSevā.guṇātmakaNiṣpādana(
        sandarbhaId,
        "sambandhāḥPrāpti",
        () => {
          const sandarbha = Sandarbha.getSandarbha(sandarbhaId);
          if (!sandarbha) {
            throw new Error(`Sandarbha not found: ${sandarbhaId}`);
          }
          
          return sandarbha.sambandhāḥPrāpti({
            prakāra: "dharmaGuṇa",
            pūrva: vastuId
          });
        }
      );
      
      if (!sambandhaResult.saphala || !Array.isArray(sambandhaResult.mūlya)) {
        return {
          saphala: true,
          mūlya: {},
          pariṇāma: "guṇātmaka",
          kriyā: "sarvaDharmaGuṇaPrāpti",
          sandarbhaId,
          kālamudrā: Date.now()
        };
      }
      
      // Group by property name, keep most recent for each
      const guṇaByName: Record<string, any> = {};
      const metaByName: Record<string, any> = {};
      const seenGuṇa = new Set<string>();
      
      // First pass - get all non-derived properties
      for (const s of sambandhaResult.mūlya) {
        const guṇaNāma = s.lakṣaṇa?.guṇaNāma;
        if (!guṇaNāma) continue;
        if (s.lakṣaṇa?.lakṣaṇa?.vyutpanna) continue; // Skip derived props for now
        
        // If we haven't seen this property yet, or this instance is newer
        if (!seenGuṇa.has(guṇaNāma) || 
            (s.lakṣaṇa?.kālamudrā || 0) > (metaByName[guṇaNāma]?.kālamudrā || 0)) {
          seenGuṇa.add(guṇaNāma);
          
          // For simple values, store directly
          if (s.lakṣaṇa?.mūlya !== null && s.lakṣaṇa?.mūlya !== undefined) {
            guṇaByName[guṇaNāma] = s.lakṣaṇa?.mūlya;
            metaByName[guṇaNāma] = {
              sambandhaId: s.id,
              kālamudrā: s.lakṣaṇa?.kālamudrā,
              lakṣaṇa: s.lakṣaṇa?.lakṣaṇa
            };
          } 
          // For complex values, get the actual value
          else {
            const complexResult = DharmaGuṇaSevā.dharmaGuṇaPrāpti(
              sandarbhaId,
              vastuId,
              guṇaNāma
            );
            
            if (complexResult.saphala) {
              guṇaByName[guṇaNāma] = complexResult.mūlya;
              metaByName[guṇaNāma] = {
                sambandhaId: s.id,
                kālamudrā: s.lakṣaṇa?.kālamudrā,
                lakṣaṇa: s.lakṣaṇa?.lakṣaṇa,
                saṃyukta: true
              };
            }
          }
        }
      }
      
      // Second pass - handle derived properties
      const derivedProps = sambandhaResult.mūlya.filter(s => 
        s.lakṣaṇa?.lakṣaṇa?.vyutpanna && 
        s.lakṣaṇa?.guṇaNāma && 
        !seenGuṇa.has(s.lakṣaṇa.guṇaNāma)
      );
      
      for (const s of derivedProps) {
        const guṇaNāma = s.lakṣaṇa?.guṇaNāma;
        if (!guṇaNāma) continue;
        
        // Get derived property value
        const derivedResult = DharmaGuṇaSevā.vyutpannaDharmaGuṇaPrāpti(
          sandarbhaId,
          vastuId,
          guṇaNāma
        );
        
        // Only add if successful
        if (derivedResult.saphala) {
          guṇaByName[guṇaNāma] = derivedResult.mūlya;
          metaByName[guṇaNāma] = {
            sambandhaId: s.id,
            kālamudrā: Date.now(),
            lakṣaṇa: s.lakṣaṇa?.lakṣaṇa,
            vyutpanna: true
          };
        }
      }
      
      return {
        saphala: true,
        mūlya: guṇaByName,
        pariṇāma: "guṇātmaka",
        kriyā: "sarvaDharmaGuṇaPrāpti",
        sandarbhaId,
        kālamudrā: Date.now(),
        meta: {
          guṇaMeta: metaByName
        }
      };
    });
  }
  
  /**
   * Define a derived property
   */
  static vyutpannaDharmaGuṇaVyākhyā(
    sandarbhaId: string,
    vastuId: string,
    guṇaNāma: string,
    ādhāra: {
      āśritaGuṇa: string[];  // dependent properties
      vyutpatti: string;     // derivation function as string
    },
    lakṣaṇa?: Record<string, any>
  ): NiṣpādanaPhala {
    return qualitative(sandarbhaId, "vyutpannaDharmaGuṇaVyākhyā", () => {
      // Create a special derived property relation
      const sambandhaResult = SandarbhaSevā.guṇātmakaNiṣpādana(
        sandarbhaId,
        "sambandhaNirmāṇa",
        () => {
          const sandarbha = Sandarbha.getSandarbha(sandarbhaId);
          if (!sandarbha) {
            throw new Error(`Sandarbha not found: ${sandarbhaId}`);
          }
          
          return sandarbha.sambandhaNirmāṇa(
            vastuId,
            `mūlya:derived:${Date.now()}`,
            "dharmaGuṇa",
            {
              guṇaNāma,
              mūlya: null, // Value will be computed when needed
              lakṣaṇa: {
                ...lakṣaṇa,
                vyutpanna: true,
                āśritaGuṇa: ādhāra.āśritaGuṇa,
                vyutpatti: ādhāra.vyutpatti
              },
              kālamudrā: Date.now()
            }
          );
        }
      );
      
      if (!sambandhaResult.saphala) {
        return {
          saphala: false,
          mūlya: null,
          pariṇāma: "guṇātmaka",
          kriyā: "vyutpannaDharmaGuṇaVyākhyā",
          sandarbhaId,
          kālamudrā: Date.now(),
          doṣa: sambandhaResult.doṣa
        };
      }
      
      return {
        saphala: true,
        mūlya: {
          vastuId,
          guṇaNāma,
          āśritaGuṇa: ādhāra.āśritaGuṇa,
          sambandhaId: sambandhaResult.mūlya
        },
        pariṇāma: "guṇātmaka",
        kriyā: "vyutpannaDharmaGuṇaVyākhyā",
        sandarbhaId,
        kālamudrā: Date.now()
      };
    });
  }
  
  /**
   * Get a derived property value
   */
  static vyutpannaDharmaGuṇaPrāpti(
    sandarbhaId: string,
    vastuId: string,
    guṇaNāma: string
  ): NiṣpādanaPhala {
    return qualitative(sandarbhaId, "vyutpannaDharmaGuṇaPrāpti", () => {
      // Find the derived property definition
      const derivedPropResult = SandarbhaSevā.guṇātmakaNiṣpādana(
        sandarbhaId,
        "sambandhāḥPrāpti",
        () => {
          const sandarbha = Sandarbha.getSandarbha(sandarbhaId);
          if (!sandarbha) {
            throw new Error(`Sandarbha not found: ${sandarbhaId}`);
          }
          
          return sandarbha.sambandhāḥPrāpti({
            prakāra: "dharmaGuṇa",
            pūrva: vastuId
          }).filter(s => 
            s.lakṣaṇa?.guṇaNāma === guṇaNāma && 
            s.lakṣaṇa?.lakṣaṇa?.vyutpanna
          )[0];
        }
      );
      
      if (!derivedPropResult.saphala || !derivedPropResult.mūlya) {
        return {
          saphala: false,
          mūlya: undefined,
          pariṇāma: "guṇātmaka",
          kriyā: "vyutpannaDharmaGuṇaPrāpti",
          sandarbhaId,
          kālamudrā: Date.now(),
          doṣa: {
            sandeśa: `Derived property not found: ${guṇaNāma} for entity ${vastuId}`
          }
        };
      }
      
      const derivedProp = derivedPropResult.mūlya;
      
      // Get dependencies
      const dependencies = derivedProp.lakṣaṇa?.lakṣaṇa?.āśritaGuṇa || [];
      const depValues: Record<string, any> = {};
      
      for (const dep of dependencies) {
        const depResult = DharmaGuṇaSevā.dharmaGuṇaPrāpti(
          sandarbhaId,
          vastuId,
          dep
        );
        
        if (depResult.saphala) {
          depValues[dep] = depResult.mūlya;
        } else {
          return {
            saphala: false,
            mūlya: undefined,
            pariṇāma: "guṇātmaka",
            kriyā: "vyutpannaDharmaGuṇaPrāpti",
            sandarbhaId,
            kālamudrā: Date.now(),
            doṣa: {
              sandeśa: `Dependency not found: ${dep} for derived property ${guṇaNāma}`
            }
          };
        }
      }
      
      // Execute the derivation function
      try {
        const vyutpatti = derivedProp.lakṣaṇa?.lakṣaṇa?.vyutpatti;
        if (!vyutpatti) {
          throw new Error(`No derivation function found for property ${guṇaNāma}`);
        }
        
        // Create function from string definition
        const deriveFn = new Function(
          'deps', 'context',
          `return (${vyutpatti})(deps, context);`
        );
        
        // Execute derivation
        const result = deriveFn(depValues, { sandarbhaId, vastuId });
        
        return {
          saphala: true,
          mūlya: result,
          pariṇāma: "guṇātmaka",
          kriyā: "vyutpannaDharmaGuṇaPrāpti",
          sandarbhaId,
          kālamudrā: Date.now(),
          meta: {
            vyutpanna: true,
            āśritaGuṇa: depValues,
            sambandha: derivedProp.id
          }
        };
      } catch (error) {
        return {
          saphala: false,
          mūlya: undefined,
          pariṇāma: "guṇātmaka",
          kriyā: "vyutpannaDharmaGuṇaPrāpti",
          sandarbhaId,
          kālamudrā: Date.now(),
          doṣa: {
            sandeśa: `Error computing derived property: ${error instanceof Error ? error.message : String(error)}`,
            vivara: error
          }
        };
      }
    });
  }
  
  /**
   * Validate a property against rules
   */
  static dharmaGuṇaPramāṇīkaraṇa(
    sandarbhaId: string,
    vastuId: string,
    guṇaNāma: string,
    niyama: Array<{
      niyamaNāma: string;
      parīkṣā: string; // validation function as string
      pramāṇīkaraṇaPrakāra?: "samaveṣita" | "ājñāpita"; // inclusive/required
    }>
  ): NiṣpādanaPhala {
    return qualitative(sandarbhaId, "dharmaGuṇaPramāṇīkaraṇa", () => {
      // Get the property value
      const guṇaResult = DharmaGuṇaSevā.dharmaGuṇaPrāpti(
        sandarbhaId,
        vastuId,
        guṇaNāma
      );
      
      if (!guṇaResult.saphala) {
        return {
          saphala: false,
          mūlya: {
            valid: false,
            doṣāḥ: [`Property not found: ${guṇaNāma}`]
          },
          pariṇāma: "guṇātmaka",
          kriyā: "dharmaGuṇaPramāṇīkaraṇa",
          sandarbhaId,
          kālamudrā: Date.now()
        };
      }
      
      const mūlya = guṇaResult.mūlya;
      const doṣāḥ: string[] = [];
      const cetāvanī: string[] = [];
      
      // Run each validation rule
      for (const niyam of niyama) {
        try {
          // Create validation function from string
          const validateFn = new Function(
            'value', 'allProps', 'context',
            `return (${niyam.parīkṣā})(value, allProps, context);`
          );
          
          // Get all properties for context
          const allPropsResult = DharmaGuṇaSevā.sarvaDharmaGuṇaPrāpti(
            sandarbhaId,
            vastuId
          );
          
          const allProps = allPropsResult.saphala ? allPropsResult.mūlya : {};
          
          // Execute validation
          const result = validateFn(mūlya, allProps, { sandarbhaId, vastuId });
          
          // Process results
          if (result === false) {
            if (niyam.pramāṇīkaraṇaPrakāra === "ājñāpita") {
              doṣāḥ.push(`Failed validation: ${niyam.niyamaNāma}`);
            } else {
              cetāvanī.push(`Warning: ${niyam.niyamaNāma}`);
            }
          } else if (typeof result === 'string') {
            if (niyam.pramāṇīkaraṇaPrakāra === "ājñāpita") {
              doṣāḥ.push(result);
            } else {
              cetāvanī.push(result);
            }
          } else if (Array.isArray(result)) {
            result.forEach(message => {
              if (niyam.pramāṇīkaraṇaPrakāra === "ājñāpita") {
                doṣāḥ.push(message);
              } else {
                cetāvanī.push(message);
              }
            });
          }
        } catch (error) {
          doṣāḥ.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Check overall validity
      const valid = doṣāḥ.length === 0;
      
      return {
        saphala: true,
        mūlya: {
          valid,
          doṣāḥ,
          cetāvanī,
          guṇaNāma,
          guṇaMūlya: mūlya
        },
        pariṇāma: "guṇātmaka",
        kriyā: "dharmaGuṇaPramāṇīkaraṇa",
        sandarbhaId,
        kālamudrā: Date.now()
      };
    });
  }
  
  /**
   * Propagate a property along relations
   */
  static dharmaGuṇaPrasāra(
    sandarbhaId: string,
    vastuId: string,
    guṇaNāma: string,
    sambandhaType: string,
    parivataka?: string // Optional transformation function as string
  ): NiṣpādanaPhala {
    return qualitative(sandarbhaId, "dharmaGuṇaPrasāra", () => {
      // Get the property value
      const guṇaResult = DharmaGuṇaSevā.dharmaGuṇaPrāpti(
        sandarbhaId,
        vastuId,
        guṇaNāma
      );
      
      if (!guṇaResult.saphala) {
        return {
          saphala: false,
          mūlya: null,
          pariṇāma: "guṇātmaka",
          kriyā: "dharmaGuṇaPrasāra",
          sandarbhaId,
          kālamudrā: Date.now(),
          doṣa: {
            sandeśa: `Source property not found: ${guṇaNāma} for entity ${vastuId}`
          }
        };
      }
      
      const mūlya = guṇaResult.mūlya;
      
      // Get related entities
      const sambandhaResult = SandarbhaSevā.guṇātmakaNiṣpādana(
        sandarbhaId,
        "sambandhāḥPrāpti",
        () => {
          const sandarbha = Sandarbha.getSandarbha(sandarbhaId);
          if (!sandarbha) {
            throw new Error(`Sandarbha not found: ${sandarbhaId}`);
          }
          
          return sandarbha.sambandhāḥPrāpti({
            prakāra: sambandhaType,
            pūrva: vastuId
          });
        }
      );
      
      if (!sambandhaResult.saphala || !Array.isArray(sambandhaResult.mūlya) || 
          sambandhaResult.mūlya.length === 0) {
        return {
          saphala: true,
          mūlya: {
            propagated: 0,
            message: `No relations of type ${sambandhaType} found`
          },
          pariṇāma: "guṇātmaka",
          kriyā: "dharmaGuṇaPrasāra",
          sandarbhaId,
          kālamudrā: Date.now()
        };
      }
      
      const sambandha = sambandhaResult.mūlya;
      
      // Create transformation function if provided
      let transformFn: (value: any, sambandha: any) => any = (value) => value;
      if (parivataka) {
        transformFn = new Function(
          'value', 'relation',
          `return (${parivataka})(value, relation);`
        ) as any;
      }
      
      // Propagate to each related entity
      const propagationResults: Record<string, any> = {};
      
      for (const samb of sambandha) {
        const targetId = samb.para;
        const transformedValue = transformFn(mūlya, samb);
        
        // Set the property on the target entity
        const setPropResult = DharmaGuṇaSevā.dharmaGuṇaSthāpana(
          sandarbhaId,
          targetId,
          guṇaNāma,
          transformedValue,
          {
            vyutpanna: false,
            saṃvedanīya: true,
            sthiratā: "asthāyī", // temporary
            vyākaraṇa: {
              propagated: true,
              sourceEntity: vastuId,
              sourceRelation: samb.id
            }
          }
        );
        
        propagationResults[targetId] = {
          success: setPropResult.saphala,
          value: transformedValue
        };
      }
      
      return {
        saphala: true,
        mūlya: {
          sourceProp: guṇaNāma,
          sourceValue: mūlya,
          propagated: Object.keys(propagationResults).length,
          targets: propagationResults
        },
        pariṇāma: "guṇātmaka",
        kriyā: "dharmaGuṇaPrasāra",
        sandarbhaId,
        kālamudrā: Date.now()
      };
    });
  }
  
  /**
   * Get property history
   */
  static dharmaGuṇaItihāsa(
    sandarbhaId: string,
    vastuId: string,
    guṇaNāma: string,
    vikalpa?: {
      prārambha?: number; // start time
      samāpti?: number;   // end time
      sīmā?: number;      // limit
    }
  ): NiṣpādanaPhala {
    return quantitative(sandarbhaId, "dharmaGuṇaItihāsa", () => {
      // Find all historical property relations
      const sambandhaResult = SandarbhaSevā.saṅkhyātmakaNiṣpādana(
        sandarbhaId,
        "sambandhāḥPrāpti",
        () => {
          const sandarbha = Sandarbha.getSandarbha(sandarbhaId);
          if (!sandarbha) {
            throw new Error(`Sandarbha not found: ${sandarbhaId}`);
          }
          
          let sambandha = sandarbha.sambandhāḥPrāpti({
            prakāra: "dharmaGuṇa",
            pūrva: vastuId
          }).filter(s => s.lakṣaṇa?.guṇaNāma === guṇaNāma);
          
          // Apply time filtering if specified
          if (vikalpa?.prārambha) {
            sambandha = sambandha.filter(s => 
              (s.lakṣaṇa?.kālamudrā || 0) >= (vikalpa.prārambha || 0)
            );
          }
          
          if (vikalpa?.samāpti) {
            sambandha = sambandha.filter(s => 
              (s.lakṣaṇa?.kālamudrā || 0) <= (vikalpa.samāpti || Date.now())
            );
          }
          
          // Sort by timestamp, newest first
          sambandha.sort((a, b) => 
            (b.lakṣaṇa?.kālamudrā || 0) - (a.lakṣaṇa?.kālamudrā || 0)
          );
          
          // Apply limit if specified
          if (vikalpa?.sīmā && vikalpa.sīmā > 0) {
            sambandha = sambandha.slice(0, vikalpa.sīmā);
          }
          
          return sambandha;
        }
      );
      
      if (!sambandhaResult.saphala || !Array.isArray(sambandhaResult.mūlya)) {
        return {
          saphala: true,
          mūlya: [],
          pariṇāma: "saṅkhyātmaka",
          kriyā: "dharmaGuṇaItihāsa",
          sandarbhaId,
          kālamudrā: Date.now()
        };
      }
      
      // Extract values and timestamps
      const itihāsa = sambandhaResult.mūlya.map(s => ({
        mūlya: s.lakṣaṇa?.mūlya,
        kālamudrā: s.lakṣaṇa?.kālamudrā || 0,
        sambandhaId: s.id,
        lakṣaṇa: s.lakṣaṇa?.lakṣaṇa
      }));
      
      return {
        saphala: true,
        mūlya: itihāsa,
        pariṇāma: "saṅkhyātmaka",
        kriyā: "dharmaGuṇaItihāsa",
        sandarbhaId,
        kālamudrā: Date.now(),
        meta: {
          vastuId,
          guṇaNāma,
          avadhi: [vikalpa?.prārambha, vikalpa?.samāpti],
          sīmā: vikalpa?.sīmā
        }
      };
    });
  }
  
  // Convenience exports
  static setProperty = DharmaGuṇaSevā.dharmaGuṇaSthāpana;
  static getProperty = DharmaGuṇaSevā.dharmaGuṇaPrāpti;
  static getAllProperties = DharmaGuṇaSevā.sarvaDharmaGuṇaPrāpti;
  static defineDerivedProperty = DharmaGuṇaSevā.vyutpannaDharmaGuṇaVyākhyā; 
  static validateProperty = DharmaGuṇaSevā.dharmaGuṇaPramāṇīkaraṇa;
  static propagateProperty = DharmaGuṇaSevā.dharmaGuṇaPrasāra;
  static getPropertyHistory = DharmaGuṇaSevā.dharmaGuṇaItihāsa;
}

// Export English aliases for external use
export const PropertyService = DharmaGuṇaSevā;
export const setProperty = DharmaGuṇaSevā.setProperty;
export const getProperty = DharmaGuṇaSevā.getProperty;
export const getAllProperties = DharmaGuṇaSevā.getAllProperties;
export const defineDerivedProperty = DharmaGuṇaSevā.defineDerivedProperty;
export const validateProperty = DharmaGuṇaSevā.validateProperty;
export const propagateProperty = DharmaGuṇaSevā.propagateProperty;
export const getPropertyHistory = DharmaGuṇaSevā.getPropertyHistory;