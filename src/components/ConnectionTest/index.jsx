import { Feather } from '@expo/vector-icons'
import { ScrollView } from 'native-base'
import { useState } from 'react'
import { Text, View } from 'react-native'
import * as Network from 'expo-network'
import Cond, { CondItem } from '../Cond'
import { useEffect } from 'react'

const ConnectionTest = ({ onCompleted, onError }) => {
  const [currentStep, setCurrentStep] = useState(0)

  const [steps, setSteps] = useState([
    { text: 'Buscando módulo NodeMCU na rede', state: 'current' },
    { text: 'Testando comunicação', state: 'unfinished' },
    { text: 'Testando leitura dos dados', state: 'unfinished' },
    { text: 'Testando escrita dos dados', state: 'unfinished' },
  ]) // state :: unfinished | current | finished | error

  const setStepByIndex = (index, value) => {
    setSteps((current) => [
      ...current.slice(0, index),
      { ...current[index], ...value },
      ...current.slice(index + 1),
    ])
  }

  function onStepCompleted() {
    setStepByIndex(currentStep, { state: 'finished' })

    if (currentStep === steps.length - 1) {
      return setTimeout(onCompleted, 1500)
    }

    setCurrentStep((current) => current + 1)
  }

  function onStepError(error) {
    setStepByIndex(currentStep, { state: 'error' })
    onError({ error })
  }

  async function findNodeMCU() {
    await Network.getIpAddressAsync()
      .then(async (ip) => {
        const [net] = ip.split(/\.(?=\d*$)/)

        const lookup = await Promise.all(
          new Array(10).fill().map(async (_, host) => {
            const ip = `${net}.${host}`

            return await fetch(`http://${ip}:3001/nodemcu-setup`)
              .then((res) => (res.status === 200 ? ip : ''))
              .catch(() => '')
          })
        )

        const ips = lookup.find(Boolean) || []

        return ips.length
          ? Promise.resolve()
          : Promise.reject(new Error('NodeMCU not found'))
      })
      .then(onStepCompleted)
      .catch(onStepError)

    console.log('Find')
  }

  function testConnection() {
    setTimeout(onStepCompleted, 1000)
    console.log('Test Connection')
  }

  function testReading() {
    setTimeout(onStepCompleted, 1000)
    console.log('Test Reading')
  }

  function testWriting() {
    setTimeout(onStepCompleted, 1000)
    console.log('Test Writing')
  }

  useEffect(() => {
    setStepByIndex(currentStep, { state: 'current' })

    switch (currentStep) {
      case 0:
        findNodeMCU()
        break
      case 1:
        testConnection()
        break
      case 2:
        testReading()
        break
      case 3:
        testWriting()
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
              <Feather name="check-circle" />
              <Text>{step.text}...</Text>
            </CondItem>

            <CondItem when="finished" className="flex-row items-center gap-1">
              <Feather name="check-circle" color="#4CAF50" />
              <Text className="text-success">{step.text}</Text>
            </CondItem>

            <CondItem when="error" className="flex-row items-center gap-1">
              <Feather name="check-circle" color="#E50014" />
              <Text className="text-error">{step.text}</Text>
            </CondItem>
          </Cond>
        </View>
      ))}
    </ScrollView>
  )
}

export default ConnectionTest
