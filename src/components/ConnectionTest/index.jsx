import { Feather } from '@expo/vector-icons'
import { Button, ScrollView, Spinner } from 'native-base'
import { useState, useEffect } from 'react'
import { Text, View } from 'react-native'
import WifiManager from 'react-native-wifi-reborn'
import Cond, { CondItem } from '../Cond'
import { useConnection } from '../../contexts/Connection'
import u from '../../utils'

const ConnectionTest = ({ data, onCompleted, onError, onBack }) => {
  const { connect, connectionCheck, getMcuIp } = useConnection()
  const [currentStep, setCurrentStep] = useState(0)

  const [steps, setSteps] = useState([
    { text: 'Conectando do NodeMCU', state: 'current' },
    { text: 'Buscando módulo NodeMCU na rede', state: 'unfinished' },
    { text: 'Testando comunicação', state: 'unfinished' }
  ]) // state :: unfinished | current | finished | error

  const setStepByIndex = (index, value) => {
    setSteps(current => [
      ...current.slice(0, index),
      { ...current[index], ...value },
      ...current.slice(index + 1)
    ])
  }

  function onStepCompleted () {
    setStepByIndex(currentStep, { state: 'finished' })

    if (currentStep === steps.length - 1) {
      return setTimeout(onCompleted, 1000)
    }

    setCurrentStep(current => current + 1)
  }

  function onStepError (error) {
    setStepByIndex(currentStep, { state: 'error' })
    onError({ error })
  }

  async function connectToMcu () {
    console.log('Connect to MCU')
    // return onStepCompleted()
    connect({ ssid: data.ssid, password: data.password })
      .then(() => WifiManager.disconnect())
      .then(() => u.sleep(15000))
      .then(onStepCompleted)
      .catch(onStepError)
  }

  async function findNodeMCU () {
    console.log('Find')
    // return onStepCompleted()
    getMcuIp()
      .then(() => u.sleep(2000))
      .then(onStepCompleted).catch(onStepError)
  }

  function testConnection () {
    console.log('Test Connection')
    connectionCheck().then(onStepCompleted).catch(onStepError)
  }

  useEffect(() => {
    setStepByIndex(currentStep, { state: 'current' })

    switch (currentStep) {
      case 0:
        connectToMcu()
        break
      case 1:
        findNodeMCU()
        break
      case 2:
        testConnection()
        break
      default:
        break
    }
  }, [currentStep])

  return (
    <ScrollView>
      {steps.map((step, i) => (
        <View key={i} className="py-1">
          <Cond watch={step.state}>
            <CondItem
              when="unfinished"
              className="flex-row items-center gap-1 opacity-30"
            >
              <Feather name="check-circle" />
              <Text>{step.text}</Text>
            </CondItem>

            <CondItem when="current" className="flex-row items-center gap-1">
              <Spinner size="sm" style={{ transform: [{ scale: 0.7 }] }} />
              <Text>{step.text}</Text>
            </CondItem>

            <CondItem when="finished" className="flex-row items-center gap-1">
              <Feather name="check-circle" color="#4CAF50" />
              <Text className="text-success">{step.text}</Text>
            </CondItem>

            <CondItem when="error" className="flex-row items-center gap-1">
              <Feather name="x-circle" color="#E50014" />
              <Text className="text-error">{step.text}</Text>
            </CondItem>
          </Cond>
        </View>
      ))}

      {steps.find(u.propEq('state', 'error')) && (
        <Button className="mt-5 bg-red-500" onPress={onBack}>
          Voltar
        </Button>
      )}
    </ScrollView>
  )
}

export default ConnectionTest
